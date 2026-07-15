const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6a5283b2002fb8a2ab1e')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function run() {
    try {
        const userId = "test_user_123";
        const permissions = [
          `read("user:${userId}")`,
          `update("user:${userId}")`,
          `delete("user:${userId}")`,
        ];
        
        await databases.createDocument("aia", "vault_meta", userId, {
            userId: userId,
            verifier: "dummy",
            salt: "dummy",
            updatedAt: new Date().toISOString()
        }, permissions);
        console.log("Success!");
    } catch(e) {
        console.error("Error creating:", e);
    }
}
run();
