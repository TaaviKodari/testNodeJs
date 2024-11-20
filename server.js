import express  from 'express';
import bodyParser, { json } from 'body-parser';
import dotenv from 'dotenv';
import  multer from 'multer';
import vision from '@google-cloud/vision';
//roskan siivous homma
import fs from 'fs';
dotenv.config();

const app = express();
const port = 3000;

//luo multer-instanssi, joka tallettaa ladatut tiedostot uploads-hakemistoon
const upload = multer({dest:'uploads/'});

app.use(bodyParser.json());
app.use(express.static('public'));

//GCV tapa luoda uusi asiakas objekti
const client = new vision.ImageAnnotatorClient({keyFilename:'omaope-vision.json'})

//yhdistetään kuvien tekstit
let koealueTekstina = '';
let context = [] //chat GPT keskustelu lista
//chat-gpt versio:  npm install dotenv
app.post('/chat', async(req, res)=>{
    const question = req.body.question;
    console.log(question);
    try{
        const response = await fetch('https://api.openai.com/v1/chat/completions',{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model:'gpt-4o-mini',
                messages:[
                    {role:'user', content: question}
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();

        if(!data.choices || data.choices[0].message.length == 0){
            throw new Error('No choices returned from API');
        }

        //console.log('Api response:',data.choices[0].message);
        
        const reply = data.choices[0].message.content;
        res.json({reply});

    }catch(error){
        console.error('Virheviesti:', error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }

    // if(question){
    //     res.json({question:`Käyttäjä kysyi ${question}`});
    // }else{
    //     res.status(400).json({error:'kysymys puuttui.'})
    // }
});

//Multerin asennus: npm install multer

app.post('/upload-Images',upload.array('images',10), async(req,res)=>{
    const files = req.files;

    //console.log(req);
    //asennetaan google-cloud/vision: npm install @google-cloud/vision
    if(!files || files.length === 0){
        return res.status(400).json({error:'No files uploaded.'})
    }
    try{
        const texts = await Promise.all(files.map(async file =>{
            const imagePath = file.path;
            const [result] = await client.textDetection(imagePath);
            const detections = result.textAnnotations;
            fs.unlinkSync(imagePath);
            return detections.length > 0 ? detections[0].description : '';
        }));
        koealueTekstina = texts.join('');
        console.log('ocr combined text:',koealueTekstina);
        context = [{role:'user', content: koealueTekstina}]
        const response = await fetch('https://api.openai.com/v1/chat/completions',{
            method:'POST',
            header:{
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`  
                },
                body: json.stringify({
                    model:'gpt-4o-mini',
                    messages:context.concat([
                        {role:'user', content:'Luo yksinkertainen ja salekeä koetehtävä ja sen vastaus yllä olevasta tekstistä suomeksi. Kysy vain yksiasia kerrallaan jne...'}
                    ]),
                    max_tokens:150
                })
        });

    }catch(error)
    {
        console.error('Error',error.message);
        res.status(500).json({error:error.message});
    }
});



//luetaan frontin kysymys requestista versio
// app.post('/chat', async(req, res)=>{
//     const question = req.body.question;
//     console.log(question);
//     if(question){
//         res.json({question:`Käyttäjä kysyi ${question}`});
//     }else{
//         res.status(400).json({error:'kysymys puuttui.'})
//     }
// });


app.listen(port, () =>{
    console.log(`Server running at http://localhost:${port}`);
})

//Pohja post kutsu.  Ei oo pakko tehdä
app.post('/chat', async(req, res)=>{
    try{

    }catch(error){
        console.log('Virheviesti:', error.message);
        res.status(500).json({error:'internal server error'})
    }
})