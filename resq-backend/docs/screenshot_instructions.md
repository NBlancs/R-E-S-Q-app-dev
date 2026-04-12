# Screenshot Proof Instructions

To satisfy the assignment requirement "Screenshot proof of running API":

1. Start server:

   - `python manage.py runserver 127.0.0.1:8000`

2. Run one authenticated HTTPie command, for example:

   - `http GET http://127.0.0.1:8000/api/cameras/ "Authorization:Token <TOKEN>"`

3. Capture one screenshot that clearly shows:

   - Running Django server in terminal (`Starting development server at http://127.0.0.1:8000/`)
   - HTTPie response output showing JSON from an endpoint

4. Save the screenshot as:

   - `docs/running-api-proof.png`

5. Include this screenshot file when submitting your repo link.
