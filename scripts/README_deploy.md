Deploy helper for TFJS mood model
================================

This small helper copies a TensorFlow.js Graph Model export (the folder that contains `model.json`) into the app static folder so the frontend can load it at `/static/models/mood-model/model.json`.

Usage
-----

From the project root run:

```bash
python3 scripts/deploy_model.py --src PATH/TO/TFJS_EXPORT --dest static/models/mood-model
```

Examples
--------

- If your export is at `mood-training-kit/web_model/tfjs`, run:

```bash
python3 scripts/deploy_model.py --src mood-training-kit/web_model/tfjs
```

Notes
-----
- The script will remove any existing files in the destination before copying.
- After a successful deploy, refresh `/mood-ai` in the browser. The frontend will use the trained model automatically if available.
