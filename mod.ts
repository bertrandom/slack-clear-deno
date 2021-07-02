import { verify } from "./verify-request.ts"

async function handleRequest(request: Request): Promise<Response> {

    if (request.method === "POST") {

        try {
            await verify(request);
        } catch (e) {

            console.error(e);

            return new Response("verification failed", {
                status: 401,
                headers: { "content-type": "text/plain" },
            });

        }

        if (request.headers.get('content-type') === 'application/x-www-form-urlencoded') {
            const formData = await request.formData();
            const payload = formData.get('payload');

            if (payload === null) {

                const command = formData.get('command');
                if (command) {

                    return new Response(" \n".repeat(50), {
                        status: 200,
                        headers: { "content-type": "text/plain" },
                    });                    

                }

            } else {

                if (typeof payload === 'string') {

                    const interactivePayload = JSON.parse(payload);
                    console.log(interactivePayload);
    
                    return new Response('OK', {
                        status: 200,
                        headers: { "content-type": "text/plain" },
                    });
    
                }
    

            }


        }

    }

    return new Response("slack-clear-deno", {
        status: 200,
        headers: { "content-type": "text/plain" },
    });

}

addEventListener("fetch", async (event) => {
    event.respondWith(await handleRequest(event.request));
});