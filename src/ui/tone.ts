import { tr } from '../i18n/index';
export type ToneMode='professional'|'aggressive'|'nuclear';

export interface ToneCopy {
  scan:string;
  evidenceHeading:string;
  noEvidence:string;
  signalsFound:string;
  severeWarning:string;
}

export function toneCopy(mode:ToneMode):ToneCopy{
  switch(mode){
    case 'nuclear':
      return {
        scan:tr('SHRED THIS SHIT'),
        evidenceHeading:tr('THE FUCKING RECEIPTS'),
        noEvidence:tr('Nothing solid yet. Keep digging before you give this store your money.'),
        signalsFound:tr('DROPSHREDDER CAUGHT SOMETHING'),
        severeWarning:tr('THIS LISTING HAS SERIOUS RESELL / DROPSHIP RED FLAGS'),
      };
    case 'aggressive':
      return {
        scan:tr('CHECK THIS SHIT'),
        evidenceHeading:tr('THE RECEIPTS'),
        noEvidence:tr('Nothing solid yet. Dig deeper before you trust the sales pitch.'),
        signalsFound:tr('DROPSHREDDER FOUND RED FLAGS'),
        severeWarning:tr('STRONG RESELL / DROPSHIP RED FLAGS'),
      };
    default:
      return {
        scan:tr('CHECK THIS PRODUCT'),
        evidenceHeading:tr('WHAT STOOD OUT'),
        noEvidence:tr('Nothing solid yet. You can dig deeper before deciding whether the listing deserves your trust.'),
        signalsFound:tr('DROPSHREDDER FOUND SOMETHING WORTH CHECKING'),
        severeWarning:tr('STRONG RESELL / DROPSHIP WARNING SIGNS'),
      };
  }
}
