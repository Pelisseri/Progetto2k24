import _https from "https";
import _url from "url";
import _fs from "fs";
import _express from "express";
import _dotenv from "dotenv";
import _cors from "cors";
import _jwt from "jsonwebtoken";
import _bcrypt from "bcryptjs";
import _headers from "./headers.json";
import Configuration from "openai"
import OpenAIApi from "openai"
import _esercizi from "./DB/esercizi.json"

let responseProcessed=false

// Lettura delle password e parametri fondamentali
_dotenv.config({ "path": ".env" });

//Configurazione ChatGPT API
const OPENAI_ORG = process.env.gpt_key
const OPENAI_API_KEY = process.env.gAIns_key
const openai = new OpenAIApi({apiKey: OPENAI_API_KEY})
const PROMPT_1 = process.env.PROMPT_1
const PROMPT_2 = process.env.PROMPT_2
const EXAMPLE_2 = process.env.EXAMPLE_2

// Variabili relative a MongoDB ed Express
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
const DBNAME = process.env.DBNAME;
const connectionString: string = process.env.connectionStringAtlas;
const app = _express();

// Creazione ed avvio del server https, a questo server occorre passare le chiavi RSA (pubblica e privata)
// app è il router di Express, si occupa di tutta la gestione delle richieste https
const HTTPS_PORT: number = parseInt(process.env.HTTPS_PORT);
let paginaErrore;
const PRIVATE_KEY = _fs.readFileSync("./keys/privateKey.pem", "utf8");
const CERTIFICATE = _fs.readFileSync("./keys/certificate.crt", "utf8");
const CREDENTIALS = { "key": PRIVATE_KEY, "cert": CERTIFICATE };
const https_server = _https.createServer(CREDENTIALS, app);
const ENCRYPTION_KEY = _fs.readFileSync("./keys/encryptionKey.txt", "utf8")
// Il secondo parametro facoltativo ipAddress consente di mettere il server in ascolto su una delle interfacce della macchina, se non lo metto viene messo in ascolto su tutte le interfacce (3 --> loopback e 2 di rete)
https_server.listen(HTTPS_PORT, () => {
    init();
    console.log(`Server HTTPS in ascolto sulla porta ${HTTPS_PORT}`);
});

function init() {
    _fs.readFile("./static/error.html", function (err, data) {
        if (err) {
            paginaErrore = `<h1>Risorsa non trovata</h1>`;
        }
        else {
            paginaErrore = data.toString();
        }
    });
}

//********************************************************************************************//
// Routes middleware
//********************************************************************************************//

// 1. Request log
app.use("/", (req: any, res: any, next: any) => {
    console.log(`-----> ${req.method}: ${req.originalUrl}`);
    next();
});

// 2. Gestione delle risorse statiche
// .static() è un metodo di express che ha già implementata la firma di sopra. Se trova il file fa la send() altrimenti fa la next()
app.use("/", _express.static("./static"));

// 3. Lettura dei parametri POST di req["body"] (bodyParser)
// .json() intercetta solo i parametri passati in json nel body della http request
app.use("/", _express.json({ "limit": "50mb" }));
// .urlencoded() intercetta solo i parametri passati in urlencoded nel body della http request
app.use("/", _express.urlencoded({ "limit": "50mb", "extended": true }));

// 4. Log dei parametri GET, POST, PUT, PATCH, DELETE
app.use("/", (req: any, res: any, next: any) => {
    if (Object.keys(req["query"]).length > 0) {
        console.log(`       ${JSON.stringify(req["query"])}`);
    }
    if (Object.keys(req["body"]).length > 0) {
        console.log(`       ${JSON.stringify(req["body"])}`);
    }
    next();
});

// 5. Controllo degli accessi tramite CORS
const corsOptions = {
    origin: function (origin, callback) {
        return callback(null, true);
    },
    credentials: true
};
app.use("/", _cors(corsOptions));

//********************************************************************************************//
// Routes finali di risposta al client
//********************************************************************************************//

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'login.html'));
});

app.post("/api/newUser", async (req, res, next) => {
    let username=req["body"].name
    let pwd=req["body"].pwd
    let newUser={
        nome: username,
        password: pwd,
        scheda: [],
        dieta: []
    }
    const client = new MongoClient(connectionString);
    await client.connect();
    let db = client.db(DBNAME);
    let collection = client.db(DBNAME).collection("utenti");
    let rq = collection.insertOne(newUser)
    rq.then((data) => res.send(data));
    rq.catch((err) => res.status(500).send(`Errore: ${err}`));
    rq.finally(() => client.close());
})

app.post("/api/logIn", async (req, res, next) => {
    let username = req["body"]["user"]
    let password = req["body"]["pwd"]
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let regex = new RegExp("^" + username + "$", "i")
    let request = collection.findOne({"nome": regex}, { "projection": { "nome": 1, "password": 1, "_id": 1 } })
    request.then((dbUser) => {
        if (!dbUser) {
            res.status(401).send("Username not valid")
        }
        else {
            _bcrypt.compare(password, dbUser.password, (err, success) => {
                if (err)
                    res.status(500).send("Bcrypt compare error " + err.message)
                else {
                    if (!success) {
                        res.status(401).send("Password not valid")
                    }
                    else {
                        let token = creaToken(dbUser);
                        console.log(token)
                        /*res.setHeader("authorization", token)
                        res.setHeader("access-control-expose-headers", "authorization")
                        res.send({ris: "ok"})*/
                        res.send(dbUser)
                    }
                }
            })
        }
    })
    request.catch((err) => {
        res.status(500).send("Query fallita")
    })
    request.finally(() => {
        client.close()
    })
})

function creaToken(data) {
    let currentTime = Math.floor(new Date().getTime() / 1000)
    let payload = {
        "_id": data._id,
        "username": data.username,
        "iat": data.iat || currentTime,
        "exp": currentTime + parseInt(process.env.durata_token)
    }
    let token = _jwt.sign(payload, ENCRYPTION_KEY)
    return token
}

app.post("/api/newScheda", async (req, res, next) => {
    let info=req["body"]
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", "content": `${JSON.stringify(_esercizi)}`},
                {"role": "system", "content": `età: ${info.eta}, sesso: ${info.sesso}, peso: ${info.peso}, altezza:
                ${info.altezza}, obiettivo: ${info.obiettivo}`},
                {"role": "system", "content": PROMPT_1}
        ],
        model: "gpt-3.5-turbo",
        response_format: {"type": "json_object"}
    });   
    let allenamento=JSON.parse(completion.choices[0].message.content)
    console.log(completion.choices[0].message.content)
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let rq = collection.updateOne({nome: info.nome}, {$set: {scheda: allenamento}})
    res.writeHead(200, _headers.json)
    res.write(JSON.stringify(allenamento))
    res.end()
});

app.post("/api/newDieta", async (req, res, next) => {
    let info=req["body"]
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", "content": `età: ${info.eta}, sesso: ${info.sesso}, peso: ${info.peso}, altezza:
                ${info.altezza}, obiettivo: ${info.obiettivo}`},
            {"role": "system", "content": `${PROMPT_2}. Segui esattamente questo esempio: ${EXAMPLE_2}`}
        ],
        model: "gpt-3.5-turbo",
        response_format: {"type": "json_object"}
    });   
    console.log(completion.choices[0].message.content)
    let dieta=JSON.parse(completion.choices[0].message.content)
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let rq = collection.updateOne({nome: info.nome}, {$set: {dieta: dieta}})
    res.writeHead(200, _headers.json)
    res.write(JSON.stringify(dieta))
    res.end()
})

app.get("/api/getScheda/:nome", async (req, res, next) => {
    let nome=req["params"].nome
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let rq = collection.findOne({"nome": nome}, {"projection": {"scheda":1, "dieta":1, "_id":1}})
    rq.then((data) => res.send(data));
    rq.catch((err) => res.status(500).send(`Errore esecuzione query: ${err}`));
    rq.finally(() => client.close());
})

app.post("/api/aggiornaLog", async (req, res, next) => {
    let username=req["body"].username
    let nome=req["body"].nome
    let log=req["body"].log
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let rq = collection.updateOne({
        "nome": username,
        $or: [
            { "scheda.Giorno 1": { $elemMatch: { "nome": nome } } },
            { "scheda.Giorno 2": { $elemMatch: { "nome": nome } } },
            { "scheda.Giorno 3": { $elemMatch: { "nome": nome } } }
        ]
        },
        {
            $set: {"scheda.Giorno 1.$[elem].log": log,
                "scheda.Giorno 2.$[elem].log": log
            }
        },
        {
            arrayFilters: [{ "elem.nome": nome }]
        }
    )
})

app.get("/api/getLog/:username/:nome", async (req, res, next) => {
    let username=req["body"].username
    let nome=req["body"].nome
    const client = new MongoClient(connectionString)
    await client.connect()
    const collection = client.db(DBNAME).collection("utenti")
    let rq = collection.findOne(
        {
            "nome": username,
            $or: [
                { "scheda.Giorno 1": { $elemMatch: { "nome": nome } } },
                { "scheda.Giorno 2": { $elemMatch: { "nome": nome } } },
                { "scheda.Giorno 3": { $elemMatch: { "nome": nome } } }
            ]
        },
        {
            "projection": {"scheda.Giorno 1.$[elem].log": 1,
            "scheda.Giorno 2.$[elem].log": 1,
            "scheda.Giorno 3.$[elem].log": 1,
            "_id": 1}
        });
    rq.then((data) => res.send(data));
    rq.catch((err) => res.status(500).send(`Errore esecuzione query: ${err}`));
    rq.finally(() => client.close());
})

//********************************************************************************************//
// Default route e gestione degli errori
//********************************************************************************************//

app.use("/", (req, res, next) => {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        res.send(`Api non disponibile`);
    }
    else {
        res.send(paginaErrore);
    }
});

app.use("/", (err, req, res, next) => {
    console.log("************* SERVER ERROR ***************\n", err.stack);
    res.status(500).send(err.message);
});