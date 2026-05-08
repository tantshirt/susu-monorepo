import { SusuError as GeneratedSusuError } from '../generated/errors/SusuError.js';

export type SusuProgramErrorDefinition = Readonly<{
  code: number;
  name: GeneratedSusuError;
}>;

// IDL-sourced numeric fallback until Codama emits a TS code -> error map.
export const SUSU_PROGRAM_ERRORS = [
  { code: 6000, name: GeneratedSusuError.GroupFull },
  { code: 6001, name: GeneratedSusuError.GroupAlreadyStarted },
  { code: 6002, name: GeneratedSusuError.MemberNotInvited },
  { code: 6003, name: GeneratedSusuError.InvalidMemberCount },
  { code: 6004, name: GeneratedSusuError.MintNotSupported },
  { code: 6005, name: GeneratedSusuError.GroupCancelled },
  { code: 6006, name: GeneratedSusuError.AlreadyAccepted },
  { code: 6007, name: GeneratedSusuError.CurveOverflow },
  { code: 6008, name: GeneratedSusuError.InvalidCurveParams },
  { code: 6009, name: GeneratedSusuError.GroupNotActive },
  { code: 6010, name: GeneratedSusuError.OutsideContributionWindow },
  { code: 6011, name: GeneratedSusuError.ContributionAmountMismatch },
  { code: 6012, name: GeneratedSusuError.MemberSlashedCannotContribute },
  { code: 6013, name: GeneratedSusuError.ContributionAlreadyRecorded },
  { code: 6014, name: GeneratedSusuError.InvalidContributionRotation },
  { code: 6015, name: GeneratedSusuError.GroupIdMismatch },
  { code: 6016, name: GeneratedSusuError.MemberPositionMismatch },
  { code: 6017, name: GeneratedSusuError.InsufficientCollateral },
  { code: 6018, name: GeneratedSusuError.GroupNotCompleted },
  { code: 6019, name: GeneratedSusuError.CollateralAlreadyWithdrawn },
  { code: 6020, name: GeneratedSusuError.CollateralForfeited },
  { code: 6021, name: GeneratedSusuError.WithinGracePeriod },
  { code: 6022, name: GeneratedSusuError.AlreadySlashed },
  { code: 6023, name: GeneratedSusuError.CannotSlashContributor },
  { code: 6024, name: GeneratedSusuError.NotAllCollateralized },
  { code: 6025, name: GeneratedSusuError.InvalidStatusTransition },
  { code: 6026, name: GeneratedSusuError.InvalidMemberPositionList },
  { code: 6027, name: GeneratedSusuError.ArithmeticOverflow },
  { code: 6028, name: GeneratedSusuError.NotRotationRecipient },
  { code: 6029, name: GeneratedSusuError.RotationNotClosed },
  { code: 6030, name: GeneratedSusuError.AlreadyClaimed },
  { code: 6031, name: GeneratedSusuError.ContributionPeriodOpen },
] as const satisfies readonly SusuProgramErrorDefinition[];

const SUSU_PROGRAM_ERRORS_BY_CODE = new Map<number, SusuProgramErrorDefinition>(
  SUSU_PROGRAM_ERRORS.map((error) => [error.code, error]),
);

export function lookupSusuProgramError(code: number): SusuProgramErrorDefinition | undefined {
  return SUSU_PROGRAM_ERRORS_BY_CODE.get(code);
}

export function decodeSusuProgramError(code: number): SusuProgramErrorDefinition | undefined {
  return lookupSusuProgramError(code);
}
