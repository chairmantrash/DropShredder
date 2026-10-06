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
        noEvidence:'No meaningful evidence yet. Deep Hunt can keep digging.',
        signalsFound:'DROP SHREDDER FOUND SOMETHING',
        severeWarning:'STRONG DROPSHIP / RESELL EVIDENCE',
      };
    case 'aggressive':
      return {
        scan:'HUNT THIS SHIT',
        evidenceHeading:'THE RECEIPTS',
        noEvidence:'No meaningful evidence yet. Deep Hunt can add provenance, supplier, review, and merchant-network evidence.',
        signalsFound:'DROPSHREDDER SIGNALS FOUND',
        severeWarning:'STRONG DROPSHIP / RESELL EVIDENCE',
      };
    default:
      return {
        scan:'SCAN THIS PRODUCT',
        evidenceHeading:'EVIDENCE',
        noEvidence:'No meaningful evidence yet. Deeper investigation can add provenance, supplier, review, and merchant-network evidence.',
        signalsFound:'DROPSHREDDER SIGNALS FOUND',
        severeWarning:'STRONG DROPSHIP / RESELL EVIDENCE',
      };
  }
}
