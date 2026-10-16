# DropShredder 0.2.0 beta 3 — public-product scan repair

Experimental Chrome/Chromium beta. This iteration fixes public product pages being refused because they contain dormant login forms. Credential regions are excluded from extraction; opening a login/payment form still refuses a scan, and late activation invalidates an existing report action. Private inputs are not read.

The unchanged259-target public-site corpus was retested through actual native Chrome controls on October13,2026. All227 accessible distinct commerce pages across47 hostnames now produce reports, compared with11 reports and216 refusals before repair. Native scan, policy and shipping actions were observed on all227. The remaining32 targets have explicit unavailable/unconfirmed/navigation outcomes. All80 headed engineering checks, including three new privacy regressions, pass;414 core tests, seven standard browser job groups and complete finding-free CodeQL pass.

Detection remains limited: all227 numerical dropshipping/resale estimates remain UNKNOWN. Ten pages produced weak catalog-sale/final-sale evidence, with zero severe warnings. Historical source shopping-scam labels are not current independent truth; hostnames do not establish distinct operators. Successful extraction is not a correct scam detection. This release changes privacy/extraction coverage, not risk weights or permissions.

Download DropShredder-0.2.0-beta.3-chrome.zip and verify SHA256:

`0f52e8f4411dc49d0a64f98f6402e1c0ee68bee13a0f60927ae3a2db7f7314b4`

For a first install, extract the ZIP, open chrome://extensions, enable Developer mode, choose Load unpacked and select the folder containing manifest.json. To update an existing beta, replace the contents of its existing unpacked folder with these extracted files and click Reload. This keeps the existing extension identity and local preferences.

Test normal public product pages and open the DropShredder side panel. Grant optional permissions only for functions you choose. Report problems at https://github.com/chairmantrash/DropShredder/issues with browser/OS, scrubbed public product URL, expected versus actual result and a screenshot without private information. Removing the extension ends participation; no account or telemetry enrollment is required.

The seven release assets include exact build hashes, the80-check native protocol and all259 page outcomes. Original pre-repair failures remain in repository DS-054 receipts. The [ScamFerret investigation](https://github.com/chairmantrash/DropShredder/blob/release/security-performance-hardening/workplane/research/DS-055-SCAMFERRET-RESEARCH-20261013.md) explains external-evidence capabilities, historical outputs and API limitations; no model calls or blacklist imports were added.

Independent rights-cleared/disjoint accuracy, approved thresholds, original photographed labels, native-language/legal/other-OS/accessibility reviews and applicable real publisher/elapsed-lifecycle acceptance remain ongoing beta work and later release-promotion inputs. No100% or independent acceptance claim. Main and Store remain separate.
