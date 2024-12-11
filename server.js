import express, { response }  from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import  multer from 'multer';
import vision from '@google-cloud/vision';
//roskan siivous homma
import fs from 'fs';
import { error } from 'console';
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
let currentQuestion = '' //muuttaja kysymyksen tallentamiseen
let correctAnswer = '' //muuttuja oikean vastauksen tallentamiseen
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
            headers:{
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`  
                },
                body: JSON.stringify({
                    model:'gpt-4o-mini',
                    messages:context.concat([
                        {role:'user', content:'Luo yksinkertainen ja salekeä koetehtävä ja sen vastaus yllä olevasta tekstistä suomeksi. Kysy vain yksiasia kerrallaan.'}
                    ]),
                    max_tokens:150
                })
            });
            const data = await response.json();
            //console.log(data);
            //console.log('API response:', JSON.stringify(data,null,2));
            //console.log(data.choices[0].message);
            const responseText = data.choices[0].message.content.trim();

            const [question, answer] = responseText.includes('Vastaus')
            ?responseText.split('Vastaus:')
            :[responseText, null];

            console.log('Parsed Question:', question);
            console.log('Parsed Answer', answer);

            if(!question || !answer){
                return res.status(400).json({error: 'Model could not generatea a calid question. Please provide a clearer text.'});
            }
            
            currentQuestion = question.trim();
            correctAnswer = answer.trim();
//päivitetään chatgpt keskustelu kysymyksellä ja vastauksella, jotta chatgpt tietää mistä on aikasemmin keskusteltu
            context.push({role: 'assistant',content: `Kysymys: ${currentQuestion}`});
            context.push({role:'assistant', content:`Vastaus: ${correctAnswer}`});
            res.json({question: currentQuestion, answer:correctAnswer});
    }catch(error)
    {
        console.error('Upload-images: Error ',error.message);
        res.status(500).json({error:error.message});
    }
});

app.post('/check-answer',async(req,res)=>{
 const userAnswer = req.body.user_answer;
 console.log(userAnswer);
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
                {role:'system', content:'Ole aina ysställinen opettaja, joka arvioi oppilaan vastauksen kohteliaaseen sävyyn'},
                {role:'user', content:`Kysymys: ${currentQuestion}`},
                {role:'user', content:`Oikea vastaus: ${correctAnswer}`},
                {role:'user', content:`Opiskelijan vastaus: ${userAnswer}`},
                {role:'user', content:`Arvioi opiskeijan vastaus asteikolla 0-10 ja anna lyhyt selitys ystävällisin ja kannustavin sanoin.`}
            ],
            max_tokens: 150
        })
    });
    const data = await response.json();
    //console.log('Api response: ', JSON.stringify(data));
    const  evaluation = data.choices[0].message.content.trim();
    console.log('Evaluation:', evaluation);
    res.json({evaluation});
    
 }catch(error){
    console.error('Virheviesti:',error.message);
 }
});

app.post('/next-question',async(req,res)=>{
    console.log('Fetching next question');
    try{
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: context.concat([{ role: 'user', content: 'Luo toinen yksinkertainen ja selkeä koetehtävä ja sen vastaus yllä olevasta tekstistä suomeksi. Kysy vain yksi asia kerrallaan.' }]),
              max_tokens: 150
            })
    });
    //vastaanota ja käsittele api vastaus json:ksi
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('No valid choices returned from API');
    } 

    //Api vastauksen käsittely
    const responseText = data.choices[0].message.content.trim();
    console.log('Response Text:', responseText); 

     const [question, answer] = responseText.includes('Vastaus:')
      ? responseText.split('Vastaus:')
      : [responseText, null]; 

    console.log('Parsed Question:', question);
    console.log('Parsed Answer:', answer);

    if (!question || !answer) {
      return res.status(400).json({ error: 'Model could not generate a valid question. Please provide a clearer text.' });
    }

    currentQuestion = question.trim(); // Päivitetään nykyinen kysymys
    correctAnswer = answer.trim(); //päivitetään oikea vastaus

    // Update context eli Chat GPI keskustelu with the question and answer
    context.push({ role: 'assistant', content: `Kysymys: ${currentQuestion}` });
    context.push({ role: 'assistant', content: `Vastaus: ${correctAnswer}` });

    res.json({ question: currentQuestion, answer: correctAnswer }); 
    }catch(error)
    {
        console.log(error);
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
// app.post('/chat', async(req, res)=>{
//     try{

//     }catch(error){
//         console.log('Virheviesti:', error.message);
//         res.status(500).json({error:'internal server error'})
//     }
// })