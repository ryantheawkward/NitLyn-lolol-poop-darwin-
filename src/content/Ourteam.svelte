<!-- SVELTE STARTS HERE -->

<script>
 
</script>

<!-- ELEMENT TAG STARTS HERE -->
<svelte:options tag="our-team" />

<!-- CSS STARTS HERE -->

<style>


#ourteam-whole{
 padding-top: 2rem;
}
#the-people{
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(4, 1fr);
    grid-template-columns: repeat(4, minmax(20rem, 1fr));
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
}

.ot-fieldset{
    border: 3px solid rgba(29, 217, 17, 0.76);
}

.legend-titles{

}
</style>

<!-- HTML STARTS HERE -->
<div id="ourteam-whole">
    <div id="the-people">
        <fieldset id="1-fieldset" class="ot-fieldset">
            <legend class="legend-titles"><b>Julian Pitterson</b></legend>
            <p>Joined : February, 9 2020</p>
            <p>Founder</p>
            <p>C.E.O</p>
            <p>Lead Developer</p>
            <p>Own's 50% Of KFC</p>
        </fieldset>
        <fieldset id="2-fieldset" class="ot-fieldset">
            <legend class="legend-titles"><b>James Allen Batara</b></legend>
            <p>Joined : February, 9 2020</p>
            <p>Co-Founder</p>
            <p>C.T.O</p>
            <p>Owns 3,500 Rice Farms In Asia</p>
        </fieldset>
        <fieldset id="3-fieldset" class="ot-fieldset">
            <legend class="legend-titles"><b>Ryan George</b></legend>
            <p>Joined : April, 5 2020</p>
            <p>Developer</p>
            <p>The World's Most Wanted Terrorist</p>
        </fieldset>
        <fieldset id="4-fieldset" class="ot-fieldset">
            <legend class="legend-titles"><b>Darwin Garcia</b></legend>
            <p>Joined : June, 5 2020</p>
            <p>Developer</p>
            <p>El Chapo's Son</p>
        </fieldset>
    </div>
</div>


