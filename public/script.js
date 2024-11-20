document.getElementById('send-button').addEventListener('click',sendMessage);
document.getElementById('send-images-button').addEventListener('click',sendImages);
document.getElementById('user-input').addEventListener('keypress',function(e){
    if(e.key == 'Enter'){
        sendMessage();
    }
})

async function sendImages()
{
    //testaan, että toimii
    //console.log("Kuvia lähetetty");

    const imageInput = document.getElementById('image-input');
    const files = imageInput.files;
    if(files.length === 0)
    {
        alert('Valitse kuvia ensin.');
        return;
    }
    const formData = new FormData();
    
    for(let i = 0; i< files.length;i++){
        formData.append('images',files[i])
    }
    //perus formDatan logitus
   // console.log(formData);
    //Hae form data sisältö
    console.log(formData.getAll('images'));
    try{
        //muista päivittää asynciksi funtio
        const response = await fetch('/upload-Images',{
            method: 'POST',
            body: formData
        })
    }catch(error)
    {
        console.error('Error:',error);
    }
}

async function sendMessage()
{
    const userInput = document.getElementById('user-input').value;
    
    if(userInput.trim() === '') return;

    addMessageToChatbox('Sinä: ' + userInput,'user-message');
    console.log(userInput);
    try{
        const response = await fetch('chat',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({question:userInput})
        })
        
            const data = await response.json();
            console.log(data.reply);
            addMessageToChatbox(data.reply,'bot-message');
    }catch(error)
    {
        console.error("Error:", error);
        addMessageToChatbox("Jotain meni pieleen. Yritä uudelleen myöhemmin",'bot-message');
    }
    document.getElementById('user-input').value = '';
}

function addMessageToChatbox(message, className){
    const messageElement = document.createElement('div');
    messageElement.classList.add('message',className);
    messageElement.textContent = message;
    document.getElementById('chatbox').appendChild(messageElement);

}