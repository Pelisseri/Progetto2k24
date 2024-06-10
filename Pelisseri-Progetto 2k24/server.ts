import _http from "http";
import _url from "url";
import _fs from "fs";
import _express from "express";
import _dotenv from "dotenv";
import _cors from "cors";
import Configuration from "openai"
import OpenAIApi from "openai"

let responseProcessed=false

// Lettura delle password e parametri fondamentali
_dotenv.config({ "path": ".env" });

//Configurazione ChatGPT API
const OPENAI_ORG = process.env.gpt_key
const OPENAI_API_KEY = process.env.gAIns_key
const openai=new OpenAIApi({apiKey: OPENAI_API_KEY})

// Variabili relative a MongoDB ed Express
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
const DBNAME = process.env.DBNAME;
const connectionString: string = process.env.connectionStringAtlas;
const app = _express();

// Creazione ed avvio del server
// app è il router di Express, si occupa di tutta la gestione delle richieste http
//const PORT: number = parseInt(process.env.PORT);
const PORT: number = 3000;
let paginaErrore;
const server = _http.createServer(app);
// Il secondo parametro facoltativo ipAddress consente di mettere il server in ascolto su una delle interfacce della macchina, se non lo metto viene messo in ascolto su tutte le interfacce (3 --> loopback e 2 di rete)
server.listen(PORT, () => {
    init();
    console.log(`Il Server è in ascolto sulla porta ${PORT}`);
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
    let username=req["body"]["nome"]
    let newUser={
        nome: username,
        password: "password",
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
})

app.get("/api/getScheda", async (req, res, next) => {
    /*if (responseProcessed) 
        return; // Se la risposta è già stata elaborata, esci dalla funzione
    else
    {
        res.writeHead(200, _headers.json);
        res.write(JSON.stringify(_allenamento));
        res.end();
        responseProcessed=true
    //}
    let selectedCollection = req["params"].collection;
    const client = new MongoClient(connectionString);
    await client.connect();
    let collection = client.db(DBNAME).collection(selectedCollection);
    let rq = collection.find().toArray();
    rq.then((data) => res.send(data));
    rq.catch((err) => res.status(500).send(`Errore esecuzione query: ${err}`));
    rq.finally(() => client.close());
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", "content": `${JSON.stringify(_braccia)} ${JSON.stringify(_gambe)} 
                ${JSON.stringify(_petto)} ${JSON.stringify(_schiena)} ${JSON.stringify(_spalle)}`}],
        model: "gpt-3.5-turbo",
      });   
    console.log(completion.choices[0]);*/
});

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