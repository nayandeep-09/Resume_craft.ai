// ============================================================
// CARD SELECTION
// ============================================================

// Get the main card container
const stage = document.querySelector('.card-stage');

// Get all authentication cards
// [... ] converts the NodeList into a normal JavaScript array
const cards = [...document.querySelectorAll('.auth-card')];

// Reuse the existing introduction area for all authentication-state copy.
const intro = document.querySelector('.intro');
const introHeading = document.querySelector('[data-intro-heading]');
const introDescription = document.querySelector('[data-intro-description]');

// One source of truth for the motivational content shown beside each active form.
const introMessages = {
    login: {
        heading: 'Great careers<br>start with<br>one <em>bold step.</em>',
        description: 'Build a resume that opens doors, showcases your strengths, and gets you closer to your dream job.'
    },
    signup: {
        heading: 'Your future<br>is yours to<br><em>create.</em>',
        description: 'Build your profile, craft your resume, and unlock opportunities with confidence.'
    },
    forgot: {
        heading: 'No worries,<br><em>we\'ve got you.</em>',
        description: 'Reset your password securely and get back to building your future.'
    }
};

let introTransition;

const cursorShadow = document.querySelector('.cursor-shadow');

if (cursorShadow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let cursorFrame;

    const moveCursorShadow = event => {
        targetX = event.clientX;
        targetY = event.clientY;

        if (!cursorFrame) cursorFrame = window.requestAnimationFrame(animateCursorShadow);
        document.body.classList.add('has-cursor-shadow');
    };

    const animateCursorShadow = () => {
        currentX += (targetX - currentX) * .16;
        currentY += (targetY - currentY) * .16;

        cursorShadow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0)`;

        if (Math.abs(targetX - currentX) > .1 || Math.abs(targetY - currentY) > .1) {
            cursorFrame = window.requestAnimationFrame(animateCursorShadow);
        } else {
            cursorFrame = null;
        }
    };

    window.addEventListener('pointermove', moveCursorShadow, { passive: true });
}


// ============================================================
// DYNAMIC INTRODUCTION CONTENT
// ============================================================

function updateIntro(name) {

    const message = introMessages[name];

    // Ignore unknown states and avoid replaying the same transition.
    if (!message || intro.dataset.state === name) return;

    window.clearTimeout(introTransition);

    // Fade the current copy out before replacing it.
    intro.classList.add('is-transitioning');

    introTransition = window.setTimeout(() => {

        introHeading.innerHTML = message.heading;
        introDescription.textContent = message.description;
        intro.dataset.state = name;

        // Removing the same class lets CSS animate the new copy into place.
        window.requestAnimationFrame(() => {
            intro.classList.remove('is-transitioning');
        });

    }, 160);
}


// ============================================================
// ACTIVATE / SWITCH CARD
// ============================================================

function activateCard(name) {

    // Stop if:
    // 1. No card name was provided
    // 2. The requested card is already active
    if (!name || stage.dataset.active === name) return;

    // Store the currently active card in the data-active attribute
    stage.dataset.active = name;

    // Keep the left-side motivational content in sync with the active form.
    updateIntro(name);


    // Go through every authentication card
    cards.forEach(card => {

        // Check whether this card is the one we want to activate
        const active = card.dataset.card === name;

        // Add/remove the "active" class
        card.classList.toggle('active', active);

        // Update accessibility information
        card.setAttribute(
            'aria-current',
            active ? 'page' : 'false'
        );

    });
}


// ============================================================
// CARD CLICK AND KEYBOARD EVENTS
// ============================================================

cards.forEach(card => {

    // --------------------------------------------------------
    // Mouse click on a card
    // --------------------------------------------------------

    card.addEventListener('click', event => {

        /*
            Only activate the card when the user clicks
            somewhere on the card itself.

            If the user clicks:
            - button
            - input
            - label
            - link

            then don't activate the card.
        */

        if (
            !event.target.closest('button,input,label,a') &&
            !card.classList.contains('active')
        ) {

            // Activate the clicked card
            activateCard(card.dataset.card);

        }

    });


    // --------------------------------------------------------
    // Keyboard support
    // --------------------------------------------------------

    card.addEventListener('keydown', event => {

        /*
            Allow users to activate an inactive card
            using:

            Enter
            OR
            Space
        */

        if (
            (event.key === 'Enter' || event.key === ' ') &&
            !card.classList.contains('active')
        ) {

            // Prevent the browser's default Space behavior
            event.preventDefault();

            // Activate the selected card
            activateCard(card.dataset.card);

        }

    });

});


// ============================================================
// LOGIN / SIGNUP / FORGOT PASSWORD SWITCH BUTTONS
// ============================================================

/*
    Find all elements that have:

        data-switch="..."

    For example:

        data-switch="signup"
        data-switch="login"
        data-switch="forgot"

    These buttons are used to switch between cards.
*/

document
    .querySelectorAll('[data-switch]')
    .forEach(button => {

        button.addEventListener('click', () => {

            // Read the target card from data-switch
            activateCard(button.dataset.switch);

        });

    });


// ============================================================
// MESSAGE DISPLAY
// ============================================================

/*
    Displays success or error messages.

    Example:

        showMessage(
            'loginMessage',
            'Login successful!',
            'success'
        );

    "id"   → ID of the message element
    "text" → Message to display
    "type" → success / error
*/

function showMessage(id, text, type) {

    // Find the message element
    const message = document.getElementById(id);

    // Put the message text inside it
    message.textContent = text;

    // Apply the message classes
    message.className = `message show ${type}`;


    // Automatically hide the message after 5 seconds
    window.setTimeout(() => {

        message.className = 'message';

    }, 5000);

}


// ============================================================
// EMAIL VALIDATION
// ============================================================

/*
    Checks whether an email has a basic valid format.

    Example of valid:

        user@gmail.com

    Example of invalid:

        user@
        @gmail.com
        user.com
*/

const isEmail = email =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


// ============================================================
// LOGIN FORM
// ============================================================

document
    .getElementById('loginForm')
    .addEventListener('submit', event => {

        // Stop the form from refreshing the page
        event.preventDefault();


        // Get the email entered by the user
        const email = document
            .getElementById('login-email')
            .value
            .trim();


        // Check email format
        if (!isEmail(email)) {

            // Show an error message
            return showMessage(
                'loginMessage',
                'Enter a valid email address to continue.',
                'error'
            );

        }


        // Currently this is only a frontend demonstration.
        // Later this will connect to your backend.
        showMessage(
            'loginMessage',
            'Login is ready to connect to your backend.',
            'success'
        );

    });


// ============================================================
// SIGNUP FORM
// ============================================================

document
    .getElementById('signupForm')
    .addEventListener('submit', event => {

        // Stop the form from refreshing the page
        event.preventDefault();


        // Get password entered by the user
        const password = document
            .getElementById('signup-password')
            .value;


        // Get confirmation password
        const confirm = document
            .getElementById('confirm-password')
            .value;


        // Get signup email
        const email = document
            .getElementById('signup-email')
            .value
            .trim();


        // --------------------------------------------------------
        // Validate email
        // --------------------------------------------------------

        if (!isEmail(email)) {

            return showMessage(
                'signupMessage',
                'Enter a valid email address.',
                'error'
            );

        }


        // --------------------------------------------------------
        // Validate password length
        // --------------------------------------------------------

        if (password.length < 6) {

            return showMessage(
                'signupMessage',
                'Use at least 6 characters for your password.',
                'error'
            );

        }


        // --------------------------------------------------------
        // Compare passwords
        // --------------------------------------------------------

        if (password !== confirm) {

            return showMessage(
                'signupMessage',
                'Your passwords do not match.',
                'error'
            );

        }


        // --------------------------------------------------------
        // Signup successful
        // --------------------------------------------------------

        // Currently this is only a frontend demonstration.
        // Later this will connect to your backend.
        showMessage(
            'signupMessage',
            'Account creation is ready to connect to your backend.',
            'success'
        );

    });


// ============================================================
// FORGOT PASSWORD FORM
// ============================================================

document
    .getElementById('forgotForm')
    .addEventListener('submit', event => {

        // Stop the form from refreshing the page
        event.preventDefault();


        // Get the email entered by the user
        const email = document
            .getElementById('forgot-email')
            .value
            .trim();


        // --------------------------------------------------------
        // Validate email
        // --------------------------------------------------------

        if (!isEmail(email)) {

            return showMessage(
                'forgotMessage',
                'Enter a valid email address.',
                'error'
            );

        }


        // --------------------------------------------------------
        // Reset request
        // --------------------------------------------------------

        // Currently this is only a frontend demonstration.
        // Later this will connect to your backend
        // and an email/password-reset service.
        showMessage(
            'forgotMessage',
            'Your reset-link request is ready to send.',
            'success'
        );

    });
