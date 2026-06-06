const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dotenv = require('dotenv');
dotenv.config();



const { config } = require('dotenv')
config();

const criptoSecretKey = process.env.CRIPTO_HASHING_SECRET_KEY;
const server = process.env.ENVIROMENT;


// :file_folder: Target directory
const directory = process.env.BUILD_OUTPUT_DIR || './dist-api';
// :closed_lock_with_key: AES encryption settings (replace with your secure key & IV if needed)

const algorithm = process.env.CRIPTO_HASHING_ALGORITHM || "aes-256-cbc";

const iv = crypto.randomBytes(16); // 16 bytes


console.log(algorithm,"algorith<<<<<<", iv);

// :spanner: Obfuscate JS files
function obfuscateJS(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(content, {
        compact: true,
        controlFlowFlattening: true,
        stringArray: true,
        rotateStringArray: true,
        stringArrayThreshold: 0.75,
    }).getObfuscatedCode();
    fs.writeFileSync(filePath, obfuscated, 'utf8');
}
// :lock: Encrypt JSON files
function encryptJSON(filePath) {
    if (!criptoSecretKey) {
        throw new Error('CRIPTO_HASHING_SECRET_KEY is required to encrypt JSON files.');
    }
    const key = crypto.createHash('sha256').update(criptoSecretKey).digest(); // 32 bytes
    const data = fs.readFileSync(filePath, 'utf8');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const result = {
        iv: iv.toString('hex'),
        data: encrypted
    };
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
}

// :repeat: Traverse and process files
function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.js')) {
            obfuscateJS(filePath);
        } /* else if (file.endsWith(".json")) {
            
            try {
                if (server == "local") {
                    encryptJSON(filePath);
                }
            } catch (error) {
                console.log(error);
                console.log(file, "erro occuee");
            }
        } */
    });
}
// :rocket: Run it
if (fs.existsSync(directory)) {
    processDirectory(directory);
} else {
    console.log(`${directory} not found, skipping obfuscation.`);
}
