/*
 * Copyright (c) 2022 ForgeRock. All rights reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */


const FATAL = 'Fatal';

// MARK CONFIG
const configForgerock = () => {
    forgerock.Config.set({
        clientId: 'spaclient',
        redirectUri: 'https://sdkapp.example.com:8443/embedded-login/',
        scope: 'openid profile address phone',
        serverConfig: {
            baseUrl: 'https://openam-fr300-unigeza.forgeblocks.com/am/',
            timeout: '9000'
        },
        realmPath: 'alpha',
        tree: 'fr541',
    });
}

// Define custom handlers to render and submit each expected step
const handlers = {

    //TODO REGISTER: handler
    

    //TODO AUTH: handler
    

    //TODO SUSPENDED: username


    //TODO SELFSERVICE: handler
   

    //TODO SUSPENDED: handler
   

    //TODO SOCIAL: selectidp


    //TODO WEBAUTHN: handlers
   

    //TODO DEVICE: handle DeviceCallback
    
                                    /* TODO CUSTOMDEVICE */
            
       

    //TODO DEVICE: handle ChoiceCallback


    Error: (step) => {
        document.querySelector('#Error span').innerHTML = step.getCode();
    },

    [FATAL]: (step) => { }
}

// Show only the view for this handler
const showStep = (handler) => {
    document.querySelectorAll('#steps > div').forEach(x => x.classList.remove('active'));
    const panel = document.getElementById(handler);
    if (!panel) {
        console.log(`No panel with ID "${handler}"" found`);
        return false;
    }
    document.getElementById(handler).classList.add('active');
    return true;
}

const showUser = (user) => {
    document.querySelector('#User pre').innerHTML = JSON.stringify(user, null, 2);
    const panel = document.querySelector('#User');
    panel.querySelector('#logout').addEventListener('click', () => {
        logout();
    });
    //TODO SELFSERVICE: clicklistener
    panel.querySelector('#changepwd').addEventListener('click', () => {
        
    });
    showStep('User')
}

const getStage = (step) => {

    //TODO STAGE: handle

    
    //TODO REGISTER: stage
    

    //TODO AUTH: step
    const usernameCallbacks = step.getCallbacksOfType('NameCallback');
    const passwordCallbacks = step.getCallbacksOfType('PasswordCallback');
   
    
    //TODO SUSPENDED: namecallback


    //TODO SELFSERVICE: pwdonly


    //TODO SOCIAL: selectidpcallback
    const selectIdPCallbacks = step.getCallbacksOfType('SelectIdPCallback');


    //TODO WEBAUTHN: webauthn steps
    const webauthnType = forgerock.FRWebAuthn.getWebAuthnStepType(step);
    

    //TODO DEVICE: device step
    const deviceCollectorCBs = step.getCallbacksOfType('DeviceProfileCallback');
   

    //TODO DEVICE: choice step
    const choiceCallbacks = step.getCallbacksOfType('ChoiceCallback');
    

    //TODO SOCIAL: redirect
    const redirectCallbacks = step.getCallbacksOfType('RedirectCallback');
  

    //DONE SUSPENDED: step
    const suspendCallbacks = step.getCallbacksOfType('SuspendedTextOutputCallback');
  

    return undefined;
};

// Display and bind the handler for this stage
const handleStep = async (step) => {
    switch (step.type) {
        case 'LoginSuccess':
            // If we have a session token, get user information
            const sessionToken = step.getSessionToken();
            const tokens = await forgerock.TokenManager.getTokens();
            const user = await forgerock.UserManager.getCurrentUser();
            return showUser(user);

        case 'LoginFailure':
            showStep('Error');
            handlers['Error'](step);
            return;

        default:
            const stage = getStage(step) || FATAL;
            showStep(stage);
            await handlers[stage](step);
    }
}

const handleFatalError = (err) => {
    console.error('Fatal error', err);
    showStep(FATAL);
}

// Get the next step using the FRAuth API
const nextStep = (step) => {
    forgerock.FRAuth.next(step).then(handleStep).catch(handleFatalError);
}


const forceAuthMiddleware = (req, action, next) => {
    switch (action.type) {
        case 'START_AUTHENTICATE':  //MARK SELFSERVICE: middleware 1
            req.url.searchParams.set('ForceAuth', 'true');  //MARK SELFSERVICE: middleware 2
            break;
    }
    next();
}

const logout = async () => {
    try {
        await forgerock.FRUser.logout();
        window.location.href = "https://sdkapp.example.com:8443/embedded-login/";
    } catch (error) {
        console.error(error)
    }
}

async function displayPage() {

    const url = new URL(window.location.href);
    
    // TODO SOCIAL: urlparam
   

    //TODO SUSPENDED: urlparam

    //TODO SUSPENDED: resume
  
    
    //TODO SOCIAL
    
 
        nextStep();
    
}

configForgerock();
displayPage();