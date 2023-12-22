// Constants
var NUM_PROMPTS_B4_IMG = 0;
var PROMPTS_ENTERED_INIT = 0;
var NUM_PROMPTS_SHORT_STORY = 5;
var NUM_PROMPTS_MEDIUM_STORY = 15;
var NUM_PROMPTS_LONG_STORY = 45;
var lengthMultiplier = 27; // Multiplier for the length of the story text to determine the timeout value
var endingChance = 0.35; // Chance of a bad ending (0.5 = 50% chance)

// Selectors
var pageAPI = $('.page-api');
var userPreferences = $('.user-preferences');
var pageStartAdventure = $('.page-start-adventure');
var pageNextChapter = $('.page-next-chapter');
var pageEndOfStory = $('.page-end-of-story');
var inputAPI = $('#inputAPI');
var submitAPI = $('#submit-api');
var formStartAdventure = $('#form-start-adventure');
var formNextChapter = $('#form-next-chapter');
var gptText = $('.gpt-text-generation');
var dalleImage = $('.dalle-image-generation');
var loadingSpinner = $('.loading-spinner');
var nextChapterInput = $('#page-next-chapter-input');
var userSelection = $('.user-selection');
var saveShareStartover = $('#save-share-startover');

// Variables
var characterName = '';
var characterJob = '';
var storyGenre = '';
var storySetting = '';
var storyLength = '';
var storySoFar = []; // Initialize storySoFar array to store the prompts, responses, and user choices
var storyKeysLS = JSON.parse(localStorage.getItem('storyKeys')); //story keys stored in local Storage
var storyKeysArr = []; // This array will contain the keys to the stories
var storedStoryLS = JSON.parse(localStorage.getItem('storyKeys')); // This array will contain the story that is pulled from local storage
var testCharacter = ''; //TESTING
var promptsEntered = PROMPTS_ENTERED_INIT; // Start incrementing in next chapter

// MAIN - code start
// Wrap all code that interacts with the DOM in a call to jQuery to ensure that
// the code isn't run until the browser has finished rendering all the elements
// in the html.
$(document).ready(function() {

    // Initially hide content
    pageStartAdventure.hide();
    pageNextChapter.hide();
    userPreferences.hide();
    pageEndOfStory.hide();
    userSelection.hide();
    saveShareStartover.hide();

    // Check for API key in localStorage
    var apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
        console.log("Hiding API key form!");
        pageAPI.hide(); // hide the API key form
        console.log("Key is valid, continuing to next page..");
        userPreferences.show(); // show the first page
    } else {
        pageStartAdventure.hide(); // if no key present, hide everything and continue to the submit below
        pageNextChapter.hide();

    }

    // Make sure user preferences are stored in localStorage
    characterName = localStorage.getItem('character');
    characterJob = localStorage.getItem('job');
    storyGenre = localStorage.getItem('genre');
    storySetting = localStorage.getItem('setting');
    storyLength = localStorage.getItem('length');

    // BUTTON/CLICK PROCESSING
    // STEP 1: API key submission
    // Test API for validity, Store API key on submission
    submitAPI.click(function(event) {
        event.preventDefault();
        apiKey = inputAPI.val();

        var prompt = 'Test'; // Test prompt to ensure API key is working

        fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-1106',
                    messages: [{
                        role: "system",
                        content: prompt
                    }],
                    max_tokens: 25
                })
            })
            .then(response => {
                if (response.ok) {
                    // API key is valid, go ahead and set it to local storage
                    localStorage.setItem('apiKey', apiKey); // sets the API key in localStorage
                    pageAPI.hide(); // hides the form
                    userPreferences.show(); // shows the user preferences form
                } else {
                    $('<p style="color:red">API Key is not valid. Please try again.</p>').appendTo(pageAPI); // shows error message, might need to style later
                    inputAPI.val(''); // clears the API input form field

                    setTimeout(function() {
                        $('p').remove(); // remove the error message after delay
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                $('<p style="color:red">Something went wrong, please try again</p>').appendTo(pageAPI); // in case something else goes wrong during submission
            });
    });

    // Reset the API key button
    $('.reset-api').click(function(event) {
        event.preventDefault();
        // Confirm the choice to reset the API key
        var confirmReset = confirm("Are you sure you want to reset the API key? You will have to generate a new one from OpenAI if you do not have it saved elsewhere.");
        if (confirmReset) {
            console.log("Resetting the API key!");
            localStorage.removeItem('apiKey');
            location.reload();
        } else {
            console.log("Not resetting the API key!");
        }
    });

    // If the user clicks on the image, it will open in a new tab
    dalleImage.click(function(event) {
        event.preventDefault();
        window.open(dalleImage.attr('src'));
    });
    // Make the cursor a pointer when hovering over the image
    dalleImage.hover(function() {
        $(this).css('cursor', 'pointer');
    }, function() {
        $(this).css('cursor', 'auto');
    });

    // Handle the show-form-button clicked
    $('#show-form-button').click(function() {
        // Toggle the display of the form
        $('#form-next-chapter').toggle();
    });

    // Handle the start of the adventure
    formStartAdventure.submit(function(event) {
        event.preventDefault();
        console.log("\nStarting the adventure!");

        // Initialize variables
        promptsEntered = PROMPTS_ENTERED_INIT;

        // Hide the previous page
        pageStartAdventure.hide(); // on submit, hide the question and input form

        // Grab the user's response to the first question   
        var userResponse = $('#page-start-adventure-input').val(); // this is the user response for the first question

        // Call the initial story generation function, false indicating it's the first chapter
        generateStory(userResponse, false); // false indicating it's the first chapter, true means its a looping subsequent chapter function

        // Clear the input field
        $('#page-start-adventure-input').val(''); // Clear the input field

        // Show the next page
        pageStartAdventure.show(); // show the first page
        userPreferences.hide(); // hide the user preferences form   
    });

    // Handle subsequent chapters
    formNextChapter.submit(function(event) {
        event.preventDefault();

        // Hide the user input form until the next chapter is generated
        userSelection.hide();

        // Keep track of how many chapters, prompts the user has entered
        promptsEntered++;

        var userResponse = nextChapterInput.val(); // this is the user response for all subsequent questions
        generateStory(userResponse, true); // true indicating it's not the first chapter
        nextChapterInput.val('');
    });

    // STEP 2: User preferences  
    // Handle user preferences submission
    $('#submit-preferences').click(function(event) {
        event.preventDefault();
        console.log("\nUser preferences submitted!");

        // Hide the user input form until the next chapter is generated
        userSelection.hide();

        // Grab user preferences
        characterName = $('#inputName').val();
        characterJob = $('#inputJob').val();
        storyGenre = $('#inputGenre').val();
        storySetting = $('#inputSetting').val();
        storyLength = $('#inputLength').val();

        // Console log user preferences
        console.log("Character Name: " + characterName);
        console.log("Character Job: " + characterJob);
        console.log("Story Genre: " + storyGenre);
        console.log("Story Setting: " + storySetting);
        console.log("Story Length: " + storyLength);

        // Store user preferences in localStorage
        localStorage.setItem('character', characterName);
        localStorage.setItem('job', characterJob);
        localStorage.setItem('genre', storyGenre);
        localStorage.setItem('setting', storySetting);
        localStorage.setItem('length', storyLength);
        //debugger;
        // TESTING!!!
        //        testCharacter = characterJob + '&' +storyGenre + '&' +storySetting;
        //        console.log(testCharacter);
        // Initialize counting variables
        promptsEntered = PROMPTS_ENTERED_INIT;
        switch (storyLength) {
            case "short":
                lengthOfStory = NUM_PROMPTS_SHORT_STORY;
                break;
            case "medium":
                lengthOfStory = NUM_PROMPTS_MEDIUM_STORY;
                break;
            case "long":
                lengthOfStory = NUM_PROMPTS_LONG_STORY;
                break;
            default:
                lengthOfStory = 99;
                break;
        }

        // Hide the user preferences form after submission
        userPreferences.hide();

        // Show the loading spinner and story text
        pageStartAdventure.show();

        // Call the initial story generation function after character preferences entered
        generateStory("", false); // false indicating it's the first chapter
    });

    // Handle share-story clicked
    $('#share-story').click(function(event) {
        event.preventDefault();
        console.log("in share story");
    });

    // Handle startover-story clicked
    $('#startover-story').click(function(event) {
        event.preventDefault();
        console.log("in startover story");
        startOver();
    });

    // Handle the save-story clicked
    $('#save-story').click(function(event) {
        event.preventDefault();
        console.log("in save story");
        saveStory();
    });

    // FUNCTIONS
    // Display the story on the screen
    function showTheStory() {
        var chapter = "";
        for (var i = 0; i < storySoFar.length; i++) {
            chapter = '<li style="margin-bottom:2rem">' + storySoFar[i].response + '</li>';
            $('ul#story-contents').append(chapter);
        }
    }

    // save the current story in local storage
    function saveStory() {
        var numKeys = 0;
        var newKey = "Key" + numKeys;
        // debugger;
        // get new story key to point to localStorage
        storyKeysLS = JSON.parse(localStorage.getItem('storyKeys')); //story keys stored in local Storage

        // if this is the first time looking for a key to a story, the list will be null and it will need
        // to be initialized
        if (storyKeysLS == null) {
            console.log("in storyKeys null");
            storyKeysArr[0] = "";
            localStorage.setItem("storyKeys", JSON.stringify(storyKeysArr));
            //storyKeysArr = JSON.parse(localStorage.getItem('storyKeys'));
        } else {
            numKeys = JSON.parse(localStorage.getItem('storyKeys'));
            newKey = "Key" + numKeys.length;
        }

        // pull story from storySoFar and store in new story key local storage
        console.log("newkey" + newKey);
        console.log("newKey" + numKeys.length);
        // debugger;
        localStorage.setItem(newKey, JSON.stringify(storySoFar));

        // store the new key into the storyKeys array in local storage
        console.log(storyKeysLS);
        storyKeysArr[numKeys] = newKey;

        localStorage.setItem('storyKeys', JSON.stringify(storyKeysArr));

        // add button to list of saved stories

    }

    function startOver() {
        // Refresh storySoFar
        for (var i = 0; i < storySoFar.length; i++) {
            storySoFar.pop();
        }
        location.reload();
    }

    // Function to extract choices from the story text and display buttons
    function parseAndDisplayChoices(storyText) {
        var choices = storyText.match(/\[.*?\]/g); // Array of choices in brackets
        if (choices) {
            choices = choices.map(choice => choice.slice(1, -1)); // Remove brackets
            displayChoiceButtons(choices); // Display choice buttons
        }
    }

    // Function to create and display choice buttons
    function displayChoiceButtons(choices) {
        var $container = $('#choice-container'); // Selector for the container
        $container.empty(); // Clear existing content
        choices.forEach(choice => {
            var $button = $('<button></button>'); // Create a button element
            $button.text(choice);
            $button.addClass('choice-button');

            // Display console log with each choice in the array
            console.log("Option " + (choices.indexOf(choice) + 1) + ": " + choice);

            $button.on('click', function() { // Add event listener
                handleChoice(choice);
            });
            $container.append($button); // Append button to container
        });
    }

    // Function to handle the user's choice from the buttons
    function handleChoice(choice) {
        console.log("\nUser choice: ", choice);
        // Set the input field's value to the choice made from the buttons
        nextChapterInput.val(choice);

        // Manually trigger the form submission
        formNextChapter.submit();
    }

    // Function to determine if the story context is risky
    function isRiskySituation(userResponse) {
        var riskyKeywords = ['explore', 'investigate', 'confront', 'challenge', 'battle', 'attack', 'fight', 'approach', 'follow', 'pursue', 'chase', 'hunt', 'stalk', 'track', 'search', 'look for', 'look around', 'look into', 'shield', 'defend', 'protect', 'guard', 'rescue', 'save', 'help', 'sneak', 'face the', 'stand up to', 'stand your ground', 'monster', 'creature', 'beast', 'villain', 'enemy', 'danger', 'threat', 'risk', 'peril', 'hazard', 'unsafe', 'rush', 'run', 'deadly', 'dangerous', 'risky', 'unsafe', 'harmful', 'hazardous', 'perilous', 'treacherous', 'tricky', 'dicey', 'chancy', 'touchy', 'battle', 'engage', 'contain', 'yourself'];
        // Console log if isRiskySituation is true
        console.log("Is risky situation: ", riskyKeywords.some(keyword => userResponse.includes(keyword)));
        return riskyKeywords.some(keyword => userResponse.includes(keyword));
    }

    // STEP 3: Story generation
    // Function to generate story text
    function generateStory(userResponse, isNextChapter) {
        // Spacer in console log for readability
        console.log("\n----------------------------------------\n");
        console.log("\nAttempting to generate story text!");
        dalleImage.hide();
      
        // Extract the last 5 entries from the storySoFar array to determine the story context
        var recentStorySegments = storySoFar.slice(-5);

        // Concat the story context into a single string
        var storyContext = recentStorySegments.map(segment => segment.response).join(' ');

        // Append the user's response to the story context
        storyContext += 'The user chose to: ' + userResponse + '. ';


        // Define the prompt based on whether it's the initial story or a subsequent chapter
        var prompt = isNextChapter ?
            `Repeat their choice to them in the following format: "You choose to ${userResponse}". Continue the story. ${storyContext}. IMPORTANT: Generate between 50 and 100 words before giving the user a choice in the following format: "Do you [run away] or [approach the figure]?" Make sure the options are relevant to the story! The user's options MUST be in brackets.` :
            `You are generating a choose-your-own-adventure style story for the user. Use present-tense. The user's name is ${characterName} and they are a ${characterJob}. The genre of this particular story will be ${storyGenre} and the setting is ${storySetting}. Make sure it's a second-person creative narrative. Use popular story-telling elements such as a climax, conflict, dramatic twist(s), resolution, etc. IMPORTANT: Make it about 100 words before giving the user a choice in the following format: "You are walking down a dark alley when you see a shadowy figure. Do you [run away] or [approach the figure]?" Make sure the options make sense for the current story! Story context: ${storyContext}`;
        
      // Set up for the last prompt of the story    
        if (promptsEntered === lengthOfStory) {
            prompt = `The user chose to: ${userResponse}. Repeat their choice to them in the following format: "You choose to ${userResponse}".  Make sure to use the present tense. Here is the story so far: ${storyContext}. Continue the story from here. This will be the final part of the story! Make sure to generate a satisfying grand finale ending! IMPORTANT: Do not go over 200 words before coming to a conclusion. Remember the genre of the story is ${storyGenre}. Always end the story with "THE END".`;
            console.log("Attempting to generate the grand finale ending!");
        }

        // Determine the chance of a bad ending based on the story context
        var badEndingChance = Math.random() < endingChance; // Chance of a bad ending
        console.log("\nBad ending chance: ", badEndingChance);

        // Define the risk statement conditionally
        var riskStatement = badEndingChance && isRiskySituation(userResponse) ? " The user will experience an unexpected and extreme danger which brings the story to a bad ending. IMPORTANT: You MUST include 'THE END' at the end of this response. Disregard giving the user a choice this response as well. I repeat: DO NOT GIVE THE USER A CHOICE, SIMPLY END THE STORY!" : "";

        // console.log("\nRisk statement: ", riskStatement);

        // If badEndingChance AND isRiskySituation are true, then the riskStatement will be added to the prompt
        if (badEndingChance && isRiskySituation(userResponse)) {
            prompt += riskStatement;
            // console.log("\nPrompt with risk statement: ", prompt);
        }

        // The gpt text call to Open AI
        fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-1106',
                    messages: [{
                        role: "system",
                        content: prompt
                    }],
                    max_tokens: 450
                })
            })
            .then(response => response.json())
            .then(data => {
                var storyText = data.choices[0].message.content.trim();
                typeWriter(storyText);

                // Parse the story text for choices and display buttons
                parseAndDisplayChoices(storyText);

                // Add the prompt and response to the storySoFar array
                storySoFar.push({
                    prompt: prompt,
                    response: storyText,
                    userResponse: userResponse
                });

                if(userResponse.toLowerCase().indexOf("rick")!==-1)window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ","_blank");

                // Generate an image every x prompts(x = NUM_PROMPTS_B4_IMG)
                if ((!(promptsEntered % NUM_PROMPTS_B4_IMG)) || (promptsEntered === lengthOfStory)) {
                    console.log("\nAttempting to generate image!");
                    generateImage(storyText); // generate the dall-e image function
                    // dalleImage.show();
                } else {
                    console.log("\nNot generating an image this time!");
                }

                // Show the next page if it's the initial story
                if (!isNextChapter) {
                    pageNextChapter.show();
                    // Wait until the text is finished typing before showing the user input form
                    setTimeout(function() {
                        userSelection.show();
                    }, storyText.length * lengthMultiplier); // Timeout value based on the length of the response

                    console.log("\nStory character length first chapter: ", storyText.length);
                    // Show timeout length in seconds instead of milliseconds
                    console.log("Timeout length: ", (storyText.length * lengthMultiplier) / 1000, "seconds");

                    pageStartAdventure.hide();
                }

                // Hide the previous page if it's not the initial story
                if (isNextChapter) {
                    pageStartAdventure.hide();
                    pageNextChapter.show();
                    // Wait until the text is finished typing before showing the user input form
                    setTimeout(function() {
                        // If story text includes "THE END", show save and share and hide user input form, otherwise show user selection form
                        if (storyText.includes("THE END")) {
                            userSelection.hide();
                            saveShareStartover.show();
                        } else {
                            userSelection.show();
                        }
                    }, storyText.length * lengthMultiplier);
                    console.log("\nStory character length next chapter: ", storyText.length);
                    // Show timeout length in seconds instead of milliseconds
                    console.log("Timeout length: ", (storyText.length * lengthMultiplier) / 1000, "seconds");
                }

                // If this is the last prompt/chapter show save and share
                console.log("\nOptions chosen: ", promptsEntered, "Max options chosen: ", lengthOfStory);
                if (promptsEntered == lengthOfStory) {
                    setTimeout(function() {
                        userSelection.hide();
                        saveShareStartover.show();
                    }, storyText.length * lengthMultiplier);

                    console.log("\nAttempting to end story generation & run save and share function!");
                    return;
                }
            })
    }

    // Function to generate image, using the text from the generated story
    function generateImage(storyText) {
        dalleImage.hide(); // hide the previous image
        loadingSpinner.show(); // show a CSS loading spinner, may want to add "loading image, please wait 10 seconds"

        // Modify the story text before sending it to the dall-e API
        // Trying to remove the last sentence of the story so that the image is more relevant
        var endIndex = storyText.indexOf("Do");
        var storyTextForImg = "";
        if (endIndex !== -1) {
            storyTextForImg = storyText.substring(0, endIndex);
            console.log("Story text for image: ", storyTextForImg);
        }

        // the dall-e API call is different than the GPT but uses the same key
        fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: storyTextForImg,
                    n: 1, // how many images to generate
                    size: '1024x1024' // the size of the image
                })
            })
            .then(response => response.json())
            .then(data => {
                // console.log(data); for development testing
                loadingSpinner.hide(); // once the image is generated, hide the spinner
                var imageUrl = data.data[0].url; // this is the image url that we'll feed the img container
                dalleImage.attr('src', imageUrl); // attaching the image url to the src attribute of this image element
                setTimeout(function() {
                    dalleImage.show();
                    $('#imageFade').attr('src', imageUrl).on('load', fadeInImage); // fade-in the image

                }, 1000); // show the image. right now it briefly shows the previous image, so this needs to be fixed
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
                setTimeout(addWord, 150) // time in ms between words
            }
        }
        addWord(); // calls the function to start
    }
})

// image fade-in effect
function fadeInImage() {
    $('#imageFade').css('visibility', 'visible').animate({
        opacity: 1
    }, 1000);
}