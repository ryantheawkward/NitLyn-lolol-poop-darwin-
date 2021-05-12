<!-- SVELTE STARTS HERE -->

<script>
// What is Nitlyn
// what type of compression do you use
// is NitLyn Free ?
// Does NitLyn Track me ?
// Will NitLyn ever be on mobile?

</script>

<!-- ELEMENT TAG STARTS HERE -->
<svelte:options tag="faq-content" />

<!-- CSS STARTS HERE -->

<style>

    #faq-content{
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(2, 1fr);
    grid-template-columns: repeat(2, minmax(20rem, 1fr));
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    }
    #faq-outer{
        border: 3px solid rgba(29, 217, 17, 0.76);
    }
.faq-sub{
    border: 3px solid rgba(29, 217, 17, 0.76);
}
#faq-content{
    margin-top: 2rem;
}

#sub2-faq{
    margin-top: 4rem;
}

#sub3-faq{
    margin-top: 4rem;
}

#sub4-faq{
    margin-top: 4rem;
}

#sub5-faq{
    margin-top: 4rem;
}

.faq-title{
    text-align: center;
}


#faq-py{
    margin-top: 3rem;
text-align: center;
}

</style>

<!-- HTML STARTS HERE -->
<div id="faq-content">
    <fieldset id="faq-outer">
        <legend><b>NitLyn's FAQ</b></legend>

        <fieldset id="sub1-faq" class="faq-sub">
                <h2 class="faq-title">What Is NitLyn?</h2>
                <p><i>Question: What Is NitLyn... I've hear about it, but i don't know what it is.</i></p>
                <p><b>Answer: NitLyn is a lossless compression application that allows its user to compress files without changes in quality of pictures or videos using their lossless compression alogrithm.</b></p>
        </fieldset>

        <fieldset id="sub2-faq" class="faq-sub">
            <h2 class="faq-title">What type of compression do you use? </h2>
            <p><i>Question: There are many different types of compression, what compression does NitLyn use?</i> </p>
             <p><b>Answer: We use LZ77 lossless compression.</b></p>
        </fieldset>

        <fieldset id="sub3-faq" class="faq-sub">
            <h2 class="faq-title">Is NitLyn Free?</h2>
            <p><i>Question: Do I have to pay for NitLyn?</i></p>
            <p><b>Answer: NitLyn is 100% free on all desktop devices</b></p>
        </fieldset>

        <fieldset id="sub4-faq" class="faq-sub">
            <h2 class="faq-title">Does NitLyn track me?</h2>
            <p><i>Question: I've heard that other services track me. Does NitLyn do the same?</i></p>
            <p><b>Answer: No, NitLyn will not track any of your personal information, however NitLyn may ask you to link your Google, Github or any other service you may have.</b></p>
        </fieldset>

<fieldset id="sub5-faq" class="faq-sub">
    <h2 class="faq-title">Will NitLyn ever be on mobile?</h2>
    <p><i>Question: I want to get NitLyn, but I only want it on my phone. Will a mobile version ever come out?</i></p>
    <p><b>Answer: Although we are focusing on a desktop development at the moment, we will be working on a mobile version very soon, hopefully after we complete the desktop development.</b></p>
</fieldset>
    <!-- More Questions = <fieldset> -> <h2> <p><b>Question</b></p> -> <p><i>Answer</i></p> -->
    </fieldset>

</div>

<div id="faq-py">
    <h3>For More Questions</h3>
    <a href="mailto:nitlynbusiness@gmail.com">Email Us Here!</a> <!-- <-- We're... We're Going To Change This Soon :(-->
</div>


