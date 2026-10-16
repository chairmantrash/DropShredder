# DS-060 native input-driver correction

The first new C100-01 native check failed with a tone-save timeout. Captured job117250553565 explicitly reports xdotool ignoring the unknown keysym ArrowDown; actual persisted tone remained Professional. This is a test input-driver failure, not a production settings failure. Existing successful Professional neutral-stamp observation is retained, and all original evidence remains in run38983826769.

Use the X11 keysym Down while retaining CDP's ArrowDown code. Rerun the full native suite on identical compiled package files, without changing production, assertions, consent or stored settings behind the UI. The233-site collection stays pinned to c17ee9b683f3b40615b2761a864e8569809cf212 and is not repeated for this test-only correction. Summary selects the corrected native run separately and records both harness identities.
