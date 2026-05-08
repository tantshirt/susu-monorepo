import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const cratePath = 'crates/susu-adversary';
const scenarioPath = `${cratePath}/src/scenarios/thirty_percent_cartel.rs`;
const scenariosIndexPath = `${cratePath}/src/scenarios/mod.rs`;
const simulatorPath = `${cratePath}/src/simulator.rs`;
const libPath = `${cratePath}/src/lib.rs`;
const readmePath = `${cratePath}/README.md`;
const unitTestPath = `${cratePath}/tests/thirty_percent_cartel.rs`;

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 5.3 adds the named 30% Cartel scenario module and public library surface', () => {
  for (const path of [scenarioPath, scenariosIndexPath, simulatorPath, libPath, readmePath, unitTestPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const scenario = read(scenarioPath);
  const squashed = compact(scenario);

  assert.match(scenario, /30% Cartel/, 'scenario doc-comment must name the headline attack');
  assert.match(scenario, /10-member|10 member/, 'scenario doc-comment must explain the fixed circle size');
  assert.match(scenario, /members 4-6|4, 5, and 6/, 'scenario doc-comment must map defector cartel members');
  assert.match(scenario, /honest net >= 0|honest.*net.*>=\s*0/s, 'scenario must document the honest-member invariant');
  assert.match(squashed, /pubfnrun\(rng:&mutChaCha20Rng,ctx:&mutSimulatorContext\)->ScenarioResult/, 'scenario must export the required run signature');
  assert.match(scenario, /member_count:\s*10|member_count\(\)\s*->\s*usize\s*\{?\s*10/, 'scenario must structurally fix a 10-member circle');
  assert.match(scenario, /DEFECTOR_MEMBERS[^=]*=\s*&?\[4,\s*5,\s*6\]|defector_members[^=]*vec!\[4,\s*5,\s*6\]/, 'defector cartel must be members 4, 5, and 6');
  assert.match(scenario, /DEFAULT_ROTATION[^=]*=\s*4|default_rotation[^=]*4/, 'cartel must default at rotation 4');
  assert.match(scenario, /ROTATIONS_BEFORE_DEFAULT[^=]*=\s*&?\[0,\s*1,\s*2,\s*3\]|funded_rotations[^=]*0.*1.*2.*3/s, 'rotations 0-3 must be funded before default');
});

test('Story 5.3 scenario assertions cover honest recovery, defector loss, and no admin intervention', () => {
  const scenario = read(scenarioPath);

  assert.match(scenario, /assert_honest_members_made_whole/, 'honest-member assertion helper must exist');
  assert.match(scenario, /net_pnl_lamports\s*>=\s*0|net_pnl_lamports\(\)\s*>=\s*0/, 'honest members must be non-negative');
  assert.match(scenario, /assert_defectors_net_negative/, 'defector-loss assertion helper must exist');
  assert.match(scenario, /net_pnl_lamports\s*<\s*0|net_pnl_lamports\(\)\s*<\s*0/, 'defectors must be net negative');
  assert.match(scenario, /assert_no_admin_intervention/, 'no-admin assertion helper must exist');
  assert.match(scenario, /admin_intervention_count\s*,\s*0|admin_intervention_count\(\)\s*,\s*0/, 'admin intervention count must be asserted as zero');
  assert.doesNotMatch(scenario, /force_settle|manual_distribution|admin_override/, 'scenario must not add admin-style settlement shortcuts');
});

test('Story 5.3 registers 30_percent_cartel in the adversary simulator report path', () => {
  const index = read(scenariosIndexPath);
  const simulator = read(simulatorPath);
  const readme = read(readmePath);

  assert.match(index, /pub\s+mod\s+thirty_percent_cartel/, 'scenario index must expose the module');
  assert.match(index, /pub\s+fn\s+all_scenarios\s*\(\s*\)\s*->\s*Vec<Scenario>/, 'scenario index must expose all_scenarios registry');
  assert.match(index, /30_percent_cartel/, 'registry must include the literal JSON scenario name');
  assert.match(simulator, /all_scenarios\(\)/, 'simulator must iterate the scenario registry');
  assert.match(simulator, /scenarios_covered/, 'simulator must populate scenarios_covered from registered scenarios');
  assert.match(simulator, /per_scenario_results/, 'simulator must emit registered per-scenario results');
  assert.match(readme, /30% Cartel/, 'crate README must include the Epic 8 30% Cartel handoff');
});

test('Story 5.3 unit tests exercise setup correctness and assertion failure sanity checks', () => {
  const unit = read(unitTestPath);

  assert.match(unit, /setup.*rotation.*3|rotation.*3.*setup/is, 'unit tests must cover setup through rotation 3');
  assert.match(unit, /members?\s*4.*5.*6|defector.*4.*5.*6/is, 'unit tests must assert the cartel member mapping');
  assert.match(unit, /should_panic|catch_unwind/, 'unit tests must verify a synthetic defector-profit state fails assertions');
  assert.match(unit, /cargo test --package susu-adversary|thirty_percent_cartel/, 'unit test file should remain tied to this scenario');
});
