
/*
 * @forgerock/javascript-sdk
 *
 * index.html
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */


// MARK CONFIG
const configForgerock = () => {
    forgerock.Config.set({
        clientId: 'spaclient',
        redirectUri: 'https://sdkapp.example.com:8443/central-login/', 
        scope: 'openid profile', 
        serverConfig: {
            baseUrl: 'https://openam-fr300-unigeza.forgeblocks.com/am/', // e.g. 
            timeout: '10000'
        },
        realmPath: 'alpha',
        tree: 'fr541', 
    });
}

// Show only the view for this handler
const showStep = (handler) => {
    document.querySelectorAll('#steps > *').forEach(x => x.classList.remove('active'));
    const panel = document.getElementById(handler);
    if (!panel) {
        console.error(`No panel with ID "${handler}"" found`);
        return false;
    }
    document.getElementById(handler).classList.add('active');
    return true;
}

const showUser = (user) => {
    document.querySelector('#User pre').innerHTML = JSON.stringify(user, null, 2);
    const panel = document.querySelector('#User');

    //DONE CENTRAL: signout
    panel.querySelector('.btn').addEventListener('click', () => {
        logout();
    });
    showStep('User');
}

const logout = async () => {
    try {
        //DONE CENTRAL: logout
        await forgerock.FRUser.logout();
        location.assign(`${document.location.origin}/central-login/`);
    } catch (error) {
        console.error(error);
    }
}

const authorize = async (code, state) => {
    /**
     *  When the user return to this app after successfully logging in,
     * the URL will include code and state query parameters that need to
     * be passed in to complete the OAuth flow giving the user access
     */

    //DONE CENTRAL: resume
    await forgerock.TokenManager.getTokens({ query: { code, state } });
    const user = await forgerock.UserManager.getCurrentUser();
    showUser(user);
}


async function displayPage() {

    //DONE CENTRAL: login
    document.querySelector('#loginBtn').addEventListener('click', async () => {
        await forgerock.TokenManager.getTokens({ login: 'redirect' });
        const user = await forgerock.UserManager.getCurrentUser();
        showUser(user);
    });
    
    document.querySelector('#forceRenewBtn').addEventListener('click', async () => {
        await forgerock.TokenManager.getTokens({ login: 'redirect', forceRenew: true });
        const user = await forgerock.UserManager.getCurrentUser();
        showUser(user);
    });
    

    /**
     * Check URL for query parameters
     */
    const url = new URL(document.location);
    const params = url.searchParams;
    const authCode = params.get('code');
    const state = params.get('state');

    /**
     * If the URL has state and authCode as query parameters, then the user
     * returned back here after successfully logging, so call authorize with
     * the values
     */
    if (state && authCode) {
        authorize(authCode, state);
    }
}


configForgerock();
displayPage();