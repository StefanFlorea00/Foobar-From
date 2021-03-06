"use strict";

import * as db from "../modules/db.min.mjs";
import * as anim from "../modules/animation.min.mjs";
import { prepareData } from "../modules/db.min.mjs";

db.get(prepareData);

let card = new Card({ form: '#payment .card-form', container: '#payment .card-wrapper'})
let card2 = new Card({ form: '#cart .card-form', container: '#cart .card-wrapper'})
let fromLastOrder = false; // quick fix to send order from last order
// toggleConfirmScreen > toggleOrderScreen > sendOrder

//! FOR LOCALHOST NETLIFY TESTING: https://foo-order-form.netlify.app/


//* EVENTLISTENERS

document.querySelector("#login-btn").addEventListener('click', function () {
    netlifyIdentity.open();
});
document.querySelector("#quick-order-login-btn").addEventListener('click', function () {
    netlifyIdentity.open();
});
document.querySelector("#review-order").addEventListener("click", function() {
    toggleConfirmScreen(getCartBeerInfo("#beer-cart-wrapper")); 
});
document.querySelector("#review-order-back").addEventListener("click", function() {
    toggleConfirmScreen(getCartBeerInfo("#beer-cart-wrapper"));
    fromLastOrder = false;
});
document.querySelector("#confirm-last-order").addEventListener("click", function(){
    toggleConfirmScreen(getCartBeerInfo("#last-order-wrapper"));
    fromLastOrder = true;
});
document.querySelector("#confirm-order").addEventListener("click", function(){
    if(fromLastOrder) sendOrder("#last-order-wrapper");
    else sendOrder("#beer-cart-wrapper");

    fromLastOrder = false;
});
document.querySelector("#unfinished-feature-screen button").addEventListener("click", toggleUnfinishedFeatureScreen);
document.querySelector("#search-btn").addEventListener("click", toggleUnfinishedFeatureScreen);
document.querySelector("#save-card-btn").addEventListener("click", toggleUnfinishedFeatureScreen);


//* NETLIFY

netlifyIdentity.on('login', user => {
    console.log('[INFO] LOGGED IN. USER:', user.user_metadata.full_name)
    checkLoggedIn();
    setTimeout(() => {
        addPreviousOrder();        
    }, 200);

    //close login screen after a bit
    setTimeout(() => {
        netlifyIdentity.close();
    }, 1500); 
});
netlifyIdentity.on('logout', () => {
    console.log('[INFO] LOGGED OUT')
    checkLoggedIn();   
});

function checkLoggedIn(){
    const user = netlifyIdentity.currentUser();
    if (user == null) {
        document.querySelector("#logged-in-text").classList.remove("hidden");
        document.querySelector("#order .order-total").classList.add("hidden");
        document.querySelector("#last-order-wrapper").innerHTML = "";
        document.querySelector("#quick-order-login-btn").classList.remove("hidden");
        document.querySelector("#login-btn").textContent = "Log In";
    } else {
        document.querySelector("#order .order-total").classList.remove("hidden");
        document.querySelector("#logged-in-text").classList.add("hidden");
        document.querySelector("#quick-order-login-btn").classList.add("hidden");
        document.querySelector("#login-btn").textContent = "Log Out";
        document.querySelector("#cart-card-wrapper").classList.add("hidden");
    }
}


//* INIT

//dirty fix to wait for fetching
db.get(init);

function init() {
    addBeerTemplates(db.getData());

    document.querySelectorAll(".beer-text-wrapper .primary-btn").forEach(btn => btn.addEventListener("click", learnMore))

    const orderBtns = document.querySelectorAll(".order-btn-wrapper button");
    orderBtns.forEach(btn => btn.addEventListener("click", addBeerQuantity));

    checkLoggedIn();

    addRecommendedBeer();
}

//* BEERS

function addRecommendedBeer(){
    let beers = document.querySelectorAll("#beers .beer-wrapper");
    let randomBeer = Math.floor(Math.random() * beers.length);

    let recommendedTexts = document.querySelectorAll("#recommended-texts p");
    let randomText = Math.floor(Math.random() * 3);

    recommendedTexts[randomText].classList.remove("hidden");
    
    addQuickTemplateFromTemplate(beers[randomBeer], "#recommended-wrapper", false);
    document.querySelector("#recommended-wrapper .order-btn-wrapper").classList.add("hidden");
}

function learnMore(e) {
    e.target.parentNode.parentNode.querySelector("section").classList.toggle("hidden");
}

function addBeerQuantity(e) {
    let orderAmount = e.target.parentNode.querySelector(".order-amount");

    if (e.target.textContent == "+") {
        orderAmount.textContent = parseInt(orderAmount.textContent) + 1;
    } else if (e.target.textContent == "-") {
        if (parseInt(orderAmount.textContent) >= 1)
            orderAmount.textContent = parseInt(orderAmount.textContent) - 1;
    }

    //if user clicks + - on the beers section
    if (e.target.parentNode.parentNode.parentNode.id == "beers") {
        addBeerToCart(e.target.parentNode.parentNode);
        updateCartTotal("#cart", "#beer-cart-wrapper");
    } else {
        changeBeerQuantity(e.target.parentNode.parentNode);
        updateCartTotal("#cart", "#beer-cart-wrapper");
    }
    if (e.target.parentNode.parentNode.parentNode.id == "last-order-wrapper"){
        updateCartTotal("#order", "#last-order-wrapper");
    }
}

function changeBeerQuantity(beer) {

    let existingBeer;
    const allBeers = document.querySelectorAll("#beers .beer-wrapper");

    for (let beerOf of allBeers) {
        if (beer.id == beerOf.id)
            existingBeer = beerOf;
    }

    if(existingBeer)
    existingBeer.querySelector(".order-amount").textContent = beer.querySelector(".order-amount").textContent;

    if (parseInt(beer.querySelector(".order-amount").textContent) == 0)
        beer.parentNode.removeChild(beer);
}

//* CART

function updateCartTotal(source, countFrom){
    let totalPrice = 0;

    document.querySelectorAll(`${countFrom} .beer-wrapper`).forEach(beer => {
        totalPrice += parseInt(beer.querySelector(".beer-price").textContent) * parseInt(beer.querySelector(".order-amount").textContent);
    })

    document.querySelector(`${source} .order-total h2 span`).textContent = totalPrice;

    updateCartNavAmount();
}

function updateCartNavAmount() {
    let cartBtnAmount = document.querySelector("#cart-btn-amount");
    let totalBeers = 0;

    document.querySelectorAll("#beer-cart-wrapper .order-amount").forEach(el => totalBeers += parseInt(el.textContent));
    cartBtnAmount.textContent = totalBeers;
    if(cartBtnAmount.textContent == "0")
        cartBtnAmount.classList.add("hidden");
    else
        cartBtnAmount.classList.remove("hidden");

}

//! Buggy when removing beers from the "beers" tab
function addBeerToCart(beer) {

    let isExistingBeer = false;
    let existingBeer;

    //check if there is a beer in cart with same id as beer in beers section
    const cartBeers = document.querySelectorAll("#beer-cart-wrapper .beer-wrapper");
    for (let cartBeer of cartBeers) {
        if (cartBeer.id == beer.id){
            isExistingBeer = true;
            existingBeer = cartBeer;
            }
    }
    console.log(existingBeer);

    //create new template in cart
    if (!isExistingBeer) {
        if (parseInt(beer.querySelector(".order-amount").textContent) != 0) {
            addQuickTemplateFromTemplate(beer, "#beer-cart-wrapper", true);
        }
    } else {
        if (parseInt(beer.querySelector(".order-amount").textContent) == 0) {
            existingBeer.parentNode.removeChild(existingBeer);
        } else
            existingBeer.querySelector(".order-amount").textContent = beer.querySelector(".order-amount").textContent;
    }

}

//* TEMPLATE

//quickTemplate is the short version of the template
function addQuickTemplateFromTemplate(beer, destination, giveId){
    const newBeer = document.querySelector("#beer-template-quick").content.cloneNode(true);

    newBeer.querySelector("h2").textContent = beer.querySelector("h2").textContent;
    newBeer.querySelector(".beer-type").textContent = beer.querySelector(".beer-type").textContent;
    newBeer.querySelector(".beer-alc").textContent = beer.querySelector(".beer-alc").textContent;
    newBeer.querySelector(".beer-price").textContent = beer.querySelector(".beer-price").textContent;
    newBeer.querySelector(".order-amount").textContent = beer.querySelector(".order-amount").textContent;
    newBeer.querySelector(".beer-label").src = beer.querySelector(".beer-label").src;

    const orderBtns = newBeer.querySelectorAll(".order-btn-wrapper");
    orderBtns.forEach(btn => btn.addEventListener("click", addBeerQuantity))

    //give random id to match beer
    if(giveId){
    const randId = Math.floor(Math.random() * Math.floor(300));
    beer.id = randId;
    newBeer.querySelector(".beer-wrapper").id = randId;
    }

    document.querySelector(destination).appendChild(newBeer);
}

function addBeerTemplates(dataArray) {
    for (let data of dataArray) {
        const template = document.querySelector("#beer-template").content.cloneNode(true);
        template.querySelector("h2").textContent = data.name;
        template.querySelector(".beer-type").textContent = data.category;
        template.querySelector(".beer-alc").textContent = data.alc;
        template.querySelector(".beer-desc").textContent = data.description.overallImpression;
        template.querySelector(".beer-label").src = "/assets/labels/" + data.label.split(".")[0] + ".jpg";


        template.querySelector(".aroma").textContent = data.description.aroma;
        template.querySelector(".appearance").textContent = data.description.appearance;
        template.querySelector(".flavor").textContent = data.description.flavor;
        template.querySelector(".mouthfeel").textContent = data.description.mouthfeel;
        template.querySelector(".overall").textContent = data.description.overallImpression;

        document.querySelector("#beers").appendChild(template);
    }
}

//* ORDER
// post the orders to the Heroku server

function sendOrder(source) {
    let postingData = [];

    let cartContent = document.querySelectorAll(`${source} .beer-wrapper`);
    cartContent.forEach(element => {
        let beerName = element.querySelector("h2").textContent;
        let beerAmount = element.querySelector(".order-amount").textContent;

        postingData.push({
            name: beerName,
            amount: beerAmount
        })
    });

    console.warn("[INFO] POSTED DATA: ");
    console.log(postingData);


    if(postingData.length!=0){
        db.post(postingData);

        const user = netlifyIdentity.currentUser();
        if (user!=null){
            localStorage.setItem(user.email, JSON.stringify(postingData));
            addPreviousOrder();
        }

        //need timeout to get response
        setTimeout(() => {
            let response = db.getResponse();       
            
            if (response.status == 500){ 
                document.querySelector("#order-response-text").classList.remove("hidden");
                document.querySelector("#order-response-text").textContent = response.message;
                document.querySelector("#order-confirm-screen").classList.add("hidden");
            }else{
                toggleOrderScreen("Your order has been successfuly sent", response.id);
                resetBeerOrders();
                updateCartTotal("#cart", "#beer-cart-wrapper");
                document.querySelector("#order-response-text").classList.add("hidden");
            }
        }, 200);
    }  

    return postingData;
};

function addPreviousOrder(){
    const user = netlifyIdentity.currentUser();
    const previousOrder = JSON.parse(localStorage.getItem(user.email));
    console.log("[INFO] PREVIOUS ORDER FROM LOCALSTORAGE: " + localStorage.getItem(user.email));

    document.querySelector("#last-order-wrapper").innerHTML = "";

    if(previousOrder){
        for (let orderedBeer of previousOrder) {
            document.querySelectorAll("#beers .beer-wrapper").forEach(beerRef => {
                if(beerRef.querySelector("h2").textContent == orderedBeer.name) {
                    addQuickTemplateFromTemplate(beerRef, "#last-order-wrapper", false);
                }
            })

            //! doesn't add beer quantity if adding last order after normal order
            document.querySelectorAll("#last-order-wrapper .beer-wrapper").forEach(addedBeer => {
                if(addedBeer.querySelector("h2").textContent == orderedBeer.name) {
                    addedBeer.querySelector(".order-amount").textContent = orderedBeer.amount;
                }
            })

        }
}

    updateCartTotal("#order", "#last-order-wrapper");
}

function resetBeerOrders() {
    document.querySelector("#beer-cart-wrapper").innerHTML = "";

    document.querySelectorAll(".order-amount").forEach(el => el.textContent = 0);
}

function getCartBeerInfo(source){

    let beerH2 = document.querySelectorAll(`${source} h2`);
    let beerAmountsElements = document.querySelectorAll(`${source} .order-amount`);
    let beerTitles = [];
    let beerAmounts = [];

    for(let i=0; i<beerH2.length ;i++){
        beerTitles[i] = beerH2[i].textContent;
        beerAmounts[i] = beerAmountsElements[i].textContent;
    }

    return {beerTitles, beerAmounts};
}

//* SCREENS

function toggleConfirmScreen(beers) {
    let orderConfirmScreen = document.querySelector("#order-confirm-screen");

    document.querySelector("#order-confirm-contents").innerHTML = "";
    for(let i=0;i<beers.beerTitles.length;i++) {
        let beerText = document.createElement("p");
        beerText.textContent = beers.beerTitles[i] + ' x ' + beers.beerAmounts[i] + ' pcs.';
        document.querySelector("#order-confirm-contents").appendChild(beerText);
        console.log(beerText);
    }
    orderConfirmScreen.classList.toggle("hidden");
}

function toggleOrderScreen(message, orderId){
    let orderFeedbackScreen = document.querySelector("#order-feedback-screen");

    orderFeedbackScreen.querySelector("h1").textContent = message;
    orderFeedbackScreen.querySelector("p span").textContent = orderId;

    orderFeedbackScreen.classList.toggle("hidden");
}


function toggleUnfinishedFeatureScreen(){
    let toggleUnfinishedFeatureScreen = document.querySelector("#unfinished-feature-screen");

    toggleUnfinishedFeatureScreen.classList.toggle("hidden");
}
