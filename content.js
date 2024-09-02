var isMinimized = false;
function hideSelfView() {
    if (isMinimized) {
        console.log("Self view is already minimized.");
        return;
    }
    clickMoreOptionsButton();
}

// Click the  "More options" button for the relevant element to show the options menu
// there are multiple "More options" buttons in the DOM, we need to find the one that is connected
// to the self view.
// When the viewport is in "mobile" view, there is an additional "more options" button for video controls.
// 
// DOM for "More options" button
//  <button class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ tWDL4c nn1vQb s4hFTd" jscontroller="soHxf" jsaction="click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef;mlnRJb:fLiPzd;" data-disable-idom="true" aria-label="More options" data-tooltip-enabled="true" data-tooltip-id="tt-c616" data-tooltip-x-position="3" data-tooltip-y-position="3" role="button" aria-expanded="false" aria-haspopup="menu" jslog="178046; track:click" style="--mdc-ripple-fg-size: 26px; --mdc-ripple-fg-scale: 1.6923076923076923; --mdc-ripple-left: 9px; --mdc-ripple-top: 9px;">
//    <div jsname="s3Eaab" class="VfPpkd-Bz112c-Jh9lGc"></div>
//    <div class="VfPpkd-Bz112c-J1Ukfc-LhBDec"></div>
//    <i class="google-material-icons VfPpkd-kBDsod" aria-hidden="true">more_vert</i>
//  </button>
function clickMoreOptionsButton() {
    console.log("Running clickMoreOptionsButton.");
    // find the last "more options" button in the dom
    const elements = document.querySelectorAll('[aria-label="More options"]');
    console.log("number of buttons found: " + elements.length);
    if (elements.length < 2) {
        console.log("Unable to minimize self view.");
        return;
    }
    // when in mobile view, there is an additional "more options" button for video controls
    var offset = window.innerWidth < 650 ? 3 : 2;
    const moreOptionsButton = elements[elements.length - offset];

    // Check if the button is found
    if (moreOptionsButton) {
        // Simulate a click on the "More options" button
        moreOptionsButton.click();
        console.log("More options button clicked.");

        requestAnimationFrame(() => {
            clickMinimizeButton();
        });
    } else {
        console.log("More options button not found.");
    }
}

// Click the "Minimize" button to hide the self view
// DOM example:
//  <li class="V4jiNc VfPpkd-StrnGf-rymPhb-ibnC6b" jsaction=" keydown:RDtNu; keyup:JdS61c; click:o6ZaF; mousedown:teoBgf; mouseup:NZPHBc; mouseleave:xq3APb; touchstart:jJiBRc; touchmove:kZeBdd; touchend:VfAz8;focusin:MeMJlc; focusout:bkTmIf;mouseenter:SKyDAe; change:uOgbud" role="menuitem" aria-label="Minimize" tabindex="-1" delegate-controller="ugmpkf">
//    <span class="VfPpkd-StrnGf-rymPhb-pZXsl"></span>
//    <span class=" VfPpkd-StrnGf-rymPhb-f7MjDc qeowcf">
//      <i class="google-material-icons" aria-hidden="true">close_fullscreen</i>
//    </span>
//    <span jsname="K4r5Ff" class="VfPpkd-StrnGf-rymPhb-b9t22c O6qLGb">Minimize</span>
//  </li>
function clickMinimizeButton() {
    console.log("Running clickMinimizeButton.");

    // Find the minimize button by its aria-label
    const minimizeButton = document.querySelector('[aria-label="Minimize"]');
  
    if (!minimizeButton) {
        console.log("Minimize button not found.");
        return;
    }
    // Simulate a click on the minimize button
    minimizeButton.click();
    console.log("Minimize button clicked.");
    isMinimized = true;

    setTimeout(() => {
        dismissDialog();
    }, 1000);
}

// dismiss the informational dialog 
// DOM example:
//   <div jsaction="keydown:I481le; mouseenter:tfO1Yc; mouseleave:JywGue" tabindex="0" data-back-to-cancel="false" class="TZFSLb ddIcCe zfYLqc fQwGrc" jscontroller="uXcmpd" role="dialog" jsname="GSQQnc" jsshadow="" aria-labelledby="c213" data-use-width-factor="true" style="inset: auto 0px 52px auto;">
//     <div class="Ssc6Id Dx8PDb nulMpf BvHyo"></div>
//    <span jsname="bN97Pc" class="bifLQe" jsslot="">
//      <div class="ZCfERe">
//         <div id="c213">You are still sending your video to others in the meeting</div>
//         <span data-is-tooltip-wrapper="true">
//             <button class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ mN1ivc xeN4qb" jscontroller="soHxf" jsaction="click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef;mlnRJb:fLiPzd;" jsname="plIjzf" data-disable-idom="true" aria-label="Close" data-tooltip-enabled="true" data-tooltip-id="tt-c214" style="--mdc-ripple-fg-size: 16px; --mdc-ripple-fg-scale: 1.75; --mdc-ripple-left: 6px; --mdc-ripple-top: 6px;">
//                 <div jsname="s3Eaab" class="VfPpkd-Bz112c-Jh9lGc"></div>
//                 <div class="VfPpkd-Bz112c-J1Ukfc-LhBDec"></div>
//                 <i class="google-material-icons VfPpkd-kBDsod ujIyse" aria-hidden="true">close</i>
//             </button>
//             <div class="EY8ABd-OWXEXe-TAWMXe" role="tooltip" aria-hidden="true" id="tt-c214">Close</div>
//         </span>
//     </div>
//     </span>    
// </div>
// dialog contents: "You are still sending your video to others in the meeting"
function dismissDialog() {
    console.log("Running dismissDialog.");
    const div = document.evaluate("//div[text()='You are still sending your video to others in the meeting']", document, null, XPathResult.ANY_TYPE, null).iterateNext();
    if (!div) {
        console.log("Helper tip dialog not found.");
        return;
    }
    // Simulate a click on the close button to dismiss the dialog
    div.parentElement.querySelector('button').click();
}

// Run the hideSelfView function when the page loads
window.addEventListener('load', hideSelfView);

// Reset isMinimized when the user navigates away from the current tab
window.addEventListener('beforeunload', function() {
    isMinimized = false;
});

// Use MutationObserver to observe for changes in the DOM and try clicking the minimize button again if changes occur
const observer = new MutationObserver(() => {
    console.log("DOM changed, re-running hideSelfView again.");
    hideSelfView();
});
  
observer.observe(document.body, { childList: true, subtree: true });