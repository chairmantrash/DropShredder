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
        scan:'SHRED THIS SHIT',
        evidenceHeading:'THE FUCKING RECEIPTS',
        noEvidence:'Nothing solid yet. Keep digging before you give this store your money.',
        signalsFound:'DROPSHREDDER CAUGHT SOMETHING',
        severeWarning:'THIS LISTING HAS SERIOUS RESELL / DROPSHIP RED FLAGS',
      };
    case 'aggressive':
      return {
        scan:'CHECK THIS SHIT',
        evidenceHeading:'THE RECEIPTS',
        noEvidence:'Nothing solid yet. Dig deeper before you trust the sales pitch.',
        signalsFound:'DROPSHREDDER FOUND RED FLAGS',
        severeWarning:'STRONG RESELL / DROPSHIP RED FLAGS',
      };
    default:
      return {
        scan:'CHECK THIS PRODUCT',
        evidenceHeading:'WHAT STOOD OUT',
        noEvidence:'Nothing solid yet. You can dig deeper before deciding whether the listing deserves your trust.',
        signalsFound:'DROPSHREDDER FOUND SOMETHING WORTH CHECKING',
        severeWarning:'STRONG RESELL / DROPSHIP WARNING SIGNS',
      };
  }
}
