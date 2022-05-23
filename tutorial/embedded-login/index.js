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

    //DONE REGISTER: handler
    Registration: (step) => {
        const panel = document.querySelector('#Registration');
        const attrdiv = panel.querySelector('#attributes');
        const attrCallbacks = step.getCallbacksOfType('StringAttributeInputCallback');

        attrCallbacks.forEach(ac => {
            const attrinput = document.createElement('input');
            attrinput.placeholder = ac.getPrompt();
            attrinput.id = ac.getName();
            attrdiv.appendChild(attrinput);
        });

        panel.querySelector('.btn').addEventListener('click', () => {
            const nameCallback = step.getCallbackOfType('NameCallback');
            const passwordCallback = step.getCallbackOfType('PasswordCallback');

            nameCallback.setName(panel.querySelector('input[type=text]').value);
            passwordCallback.setPassword(panel.querySelector('input[type=password]').value);

            attrCallbacks.forEach(ac => {
                ac.setInputValue(attrdiv.querySelector('#' + ac.getName()).value);
            });


            nextStep(step);
        })
    },

    //DONE AUTH: handler
    UsernamePassword: (step) => {
        const panel = document.querySelector('#UsernamePassword');

        panel.querySelector('.btn').addEventListener('click', () => {
            const nameCallback = step.getCallbackOfType('NameCallback');
            const passwordCallback = step.getCallbackOfType('PasswordCallback');
            nameCallback.setName(panel.querySelector('input[type=text]').value);
            passwordCallback.setPassword(panel.querySelector('input[type=password]').value);
            nextStep(step);
        })
    },

    //DONE SUSPENDED: username
    UsernameOnly: (step) => {
        const panel = document.querySelector('#UsernameOnly');
        panel.querySelector('.btn').addEventListener('click', () => {
            const nameCallback = step.getCallbackOfType('NameCallback');
            nameCallback.setName(panel.querySelector('input[type=text]').value);
            nextStep(step);
        })
    },

    //DONE SELFSERVICE: handler
    PasswordOnly: (step) => {
        const panel = document.querySelector('#PasswordOnly');
        const pageDescription = panel.querySelector('#PageDescription');
        pageDescription.innerText = step.getDescription();
        panel.querySelector('input[type=password]').value = "";

        panel.querySelector('.btn').addEventListener('click', () => {
            const passwordCallback = step.getCallbackOfType('PasswordCallback');
            passwordCallback.setPassword(panel.querySelector('input[type=password]').value);
            nextStep(step);
        })
    },

    //DONE SUSPENDED: handler
    Suspended: (step) => {
        const panel = document.querySelector('#Suspended');
        const suspendMessageDiv = panel.querySelector('#SuspendMessage');
        suspendMessageDiv.innerText = step.getCallbackOfType('SuspendedTextOutputCallback').getMessage();
    },

    //DONE SOCIAL: selectidp
    SelectIdPCallback: (step) => {
        const panel = document.querySelector('#SelectIdPCallback');
        const selectElement = panel.querySelector('#SelectElement');

        const selectIdPCallback = step.getCallbackOfType('SelectIdPCallback');

        selectIdPCallback.getProviders().forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.provider;
            opt.innerHTML = p.provider;
            selectElement.appendChild(opt);
        })

        panel.querySelector('.btn').addEventListener('click', () => {
            selectIdPCallback.setProvider(selectElement.value);
            nextStep(step);
        })

    },

    //DONE WEBAUTHN: handlers
    WebAuthnReg: async (step) => {
        //registering a new device
        step = await forgerock.FRWebAuthn.register(step);
        nextStep(step);
    },

    WebAuthnAuthn: async (step) => {
        // Authenticating with a registered device
        step = await forgerock.FRWebAuthn.authenticate(step);
        nextStep(step);

    },

    //DONE DEVICE: handle DeviceCallback
    Device: async (step) => {
        const deviceCollectorCB = step.getCallbackOfType('DeviceProfileCallback');
        const isLocationRequired = deviceCollectorCB.isLocationRequired();
        const isMetadataRequired = deviceCollectorCB.isMetadataRequired();

        const device = new forgerock.FRDevice(/*TODO CUSTOMDEVICE */
            
        );       

        const profile = await device.getProfile({
            location: isLocationRequired,
            metadata: isMetadataRequired
        });

        console.log("device profile: " + profile);

        deviceCollectorCB.setProfile(profile);
        nextStep(step);
    },

    //DONE DEVICE: handle ChoiceCallback
    Choice: (step) => {
        const panel = document.querySelector('#Choice');
        const selectElement = panel.querySelector('#SelectElement');

        const choiceCallback = step.getCallbackOfType('ChoiceCallback');

        choiceCallback.getChoices().forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.innerHTML = p;
            selectElement.appendChild(opt);
        })

        panel.querySelector('.btn').addEventListener('click', () => {
            choiceCallback.setChoiceValue(selectElement.value);
            nextStep(step);
        })
    },

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
    //DONE SELFSERVICE: clicklistener
    panel.querySelector('#changepwd').addEventListener('click', () => {
        const selfServiceStepOptions = { tree: 'fr541-password', middleware: [forceAuthMiddleware] };
        forgerock.FRAuth.next(undefined, selfServiceStepOptions).then(handleStep).catch(handleFatalError);

    });
    showStep('User')
}

const getStage = (step) => {

    //DONE STAGE: handle
    const stage = step.getStage();
    if (stage == "namepass") { return "UsernamePassword"; }
    
    //DONE REGISTER: stage
    if (stage == "Registration") {return "Registration";} 
    

    //DONE AUTH: step
    const usernameCallbacks = step.getCallbacksOfType('NameCallback');
    const passwordCallbacks = step.getCallbacksOfType('PasswordCallback');
    if (usernameCallbacks.length && passwordCallbacks.length) {
        return "UsernamePassword";
    }
    
    //DONE SUSPENDED: namecallback
    if (usernameCallbacks.length) {
        return "UsernameOnly";
    }

    //DONE SELFSERVICE: pwdonly
    if (passwordCallbacks.length) {
        return "PasswordOnly";
    }

    //DONE SOCIAL: idpcallback
    const selectIdPCallbacks = step.getCallbacksOfType('SelectIdPCallback');
    if (selectIdPCallbacks.length) {
        return "SelectIdPCallback"
    }

    //DONE WEBAUTHN: webauthn steps
    const webauthnType = forgerock.FRWebAuthn.getWebAuthnStepType(step);
    if (webauthnType === forgerock.WebAuthnStepType.Registration) {
        return "WebAuthnReg";
    } else if (webauthnType === forgerock.WebAuthnStepType.Authentication) {
        return "WebAuthnAuthn";
    }

    //DONE DEVICE: device step
    const deviceCollectorCBs = step.getCallbacksOfType('DeviceProfileCallback');
    if (deviceCollectorCBs.length) {
        return "Device";
    }

    //DONE DEVICE: choice step
    const choiceCallbacks = step.getCallbacksOfType('ChoiceCallback');
    if (choiceCallbacks.length) {
        return "Choice";
    }

    //DONE SOCIAL: redirect
    const redirectCallbacks = step.getCallbacksOfType('RedirectCallback');
    if (redirectCallbacks.length) {
        forgerock.FRAuth.redirect(step);
    }

    //DONE SUSPENDED: step
    const suspendCallbacks = step.getCallbacksOfType('SuspendedTextOutputCallback');
    if (suspendCallbacks.length) {
        return "Suspended";
    }

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

    // DONE SOCIAL: url
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    //DONE SUSPENDED: urlparam
    const suspId = url.searchParams.get('suspendedId');

    if (code && state) {
        const step = await forgerock.FRAuth.resume(window.location.href);
        handleStep(step);

    //DONE SUSPENDED: resume
    } else if (suspId) {
        const step = await forgerock.FRAuth.next(null, {
            query: {
                suspendedId: suspId
            }
        });
        handleStep(step);
    } else {
        nextStep();
    }
}

configForgerock();
displayPage();