
// Selectors
var pageAPI = $('.page-api');
var pageStartAdventure = $('.page-start-adventure');
var pageNextChapter = $('.page-next-chapter');
var inputAPI = $('#inputAPI');
var submitAPI = $('#submit-api');
var formStartAdventure = $('#form-start-adventure');
var formNextChapter = $('#form-next-chapter');
var gptText = $('.gpt-text-generation');
var dalleImage = $('.dalle-image-generation');
var loadingSpinner = $('.loading-spinner');

// Initially hide content until API is entered
pageStartAdventure.hide();
pageNextChapter.hide();

// Check for API key in localStorage
var apiKey = localStorage.getItem('apiKey');
if (apiKey) {
    pageAPI.hide(); // hide the API key form
    pageStartAdventure.show(); // show the first page
} else {
    pageStartAdventure.hide(); // if no key present, hide everything and continue to the submit below
    pageNextChapter.hide();
}

// Test API for validity, Store API key on submission
submitAPI.click(function(event) {
    event.preventDefault();
    apiKey = inputAPI.val();

    var prompt = 'Test';

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{role: "system", content: prompt}],
            max_tokens: 25
        })
    })
    .then(response => {
        if (response.ok) {
            // API key is valid
            localStorage.setItem('apiKey', apiKey); // sets the API key in localStorage
            pageAPI.hide(); // hides the form
            pageStartAdventure.show(); // shows the story start question
        } else {
            $('<p style="color:red">API Key is not valid. Please try again.</p>').appendTo(pageAPI);
            inputAPI.val('');
        }
    })
   .catch(error => {
        console.error('Error:', error);
        $('<p style="color:red">Something went wrong, please try again</p>').appendTo(pageAPI);
   });
});

// Handle the start of the adventure
formStartAdventure.submit(function(event) {
    event.preventDefault();
    pageStartAdventure.hide(); // on submit, hide the question and input form
    var userResponse = $('#page-start-adventure-input').val(); // this is the user response for the first question
    generateStory(userResponse, false); // false indicating it's the first chapter, true means its a looping subsequent chapter function
    $('#page-start-adventure-input').val(''); // Clear the input field
});

// Handle subsequent chapters
formNextChapter.submit(function(event) {
    event.preventDefault();
    var userResponse = $('#page-next-chapter-input').val(); // this is the user response for all subsequent questions
    generateStory(userResponse, true); // true indicating it's not the first chapter
    $('#page-next-chapter-input').val('');
});

// Function to generate story text
function generateStory(userResponse, isNextChapter) {
    var prompt = isNextChapter ? 
                    `Continue the story: ${userResponse}, second-person creative narrative with dramatic twists, make it about 75 words, use the present tense.` : 
                    `Start a story with: ${userResponse}, second-person creative narrative with dramatic twists, make it about 75 words, use the present tense.`;

    // The gpt text call to Open AI                   
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{role: "system", content: prompt}],
            max_tokens: 200 
        })
    })
    .then(response => response.json())
    .then(data => {
        var storyText = data.choices[0].message.content.trim(); // this is where the response is stored in data
        typeWriter(storyText); // show the response text in the gptText element
        pageNextChapter.show(); // show the text on the page
        generateImage(storyText); // generate the dall-e image function
    });
}

 // Function to generate image, using the text from the generated story
 function generateImage(storyText) {
    dalleImage.hide(); // hide the previous image
    loadingSpinner.show() // show a CSS loading spinner, may want to add "loading image, please wait 10 seconds"

    // the dall-e API call is different than the GPT but uses the same key
    fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: (storyText + "Don't have text in the image. I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:"),
            n: 1, // how many images to generate
            size: '1024x1024' // the size of the image, i wonder if a smaller size takes less tokens?
        })
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data); for development testing
        loadingSpinner.hide(); // once the image is generated, hide the spinner
        var imageUrl = data.data[0].url; // this is the image url that we'll feed the img container
        dalleImage.attr('src', imageUrl); // attaching the image url to the src attribute of this image element
        dalleImage.show(); // show the image. right now it briefly shows the previous image, so this needs to be fixed
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function typeWriter(text) {
    var words = text.split(' '); // Splits the gpt response into individual words
    var i = 0;
    gptText.empty(); // clears any existing content

    function addWord() {
        if (i < words.length) {
            gptText.append(words[i] + ' '); // Add the next word
            i++;
            setTimeout(addWord, 200) // let's try 200 milliseconds
        }
    }
    addWord(); // calls the function to start
}

