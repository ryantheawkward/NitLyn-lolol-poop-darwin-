<script>

    export let macdwnld = 'Default';
    export let linuxdwnlddeb; // Change Later
    export let linuxdwnldrpm; // Change Later
    export let windowsdwnld = 'Default';
    export let deberr = "";
    export let rpmerr = "";

    function debOnclick(){
        alert("We are sorry our .deb files arent working at the moment try again later");
    }

    function rpmOnclick(){
        alert("We are sorry our .rpm files arent working at the moment try again later");
    }
</script>

<!-- Element Tag GOES HERE -->
<svelte:options tag="download-fc" />

<!-- CSS STARTS HERE -->

<style>
    #WholeDownload{
        /*width: 62.7rem;
        height: 30rem;
        background-color: grey; */
        display: grid;
        gap: 1rem;
        margin-top: 10rem;
        grid-template-columns: repeat(3, 1fr);
        grid-template-columns: repeat(3, minmax(20rem, 1fr));
        grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    }
    .MacDownload:hover{

    }
    .MacDownload{
        /* width: 20rem;
         height: 18rem; */
        border-color: rgba(29, 217, 17, 0.76);
        border-width: 3px;
        border-style: solid;

    }
    .MacosDownloadHead{
        text-align: center;
    }

    .MacosDownloadBody{
        text-align: center;
    }
    #MacDownloadButton{
      /*  background-color: DodgerBlue; */
        border: none;
        color: DodgerBlue;
        padding: 12px 30px;
        cursor: pointer;
        font-size: 20px;
        border-width: 3px;
        border-style: solid;
        border-color: #0b86ff;
        box-shadow: #333333;
    }
    #MacDownloadButton:hover{
        color: white;
        background-color: rgba(0,24,255,0.76);
        transition-delay: 5ms;
        transition-duration: 20ms;
    }


    .LinuxDownload{
        /*  width: 20rem;
          height: 18rem; */
        border-color: rgba(29, 217, 17, 0.76);
        border-width: 3px;
        border-style: solid;
    }
    .LinuxDownloadHead{
        text-align: center;
    }

    .LinuxDownloadBody{
        text-align: center;
    }
    #LinuxDownloadButtonrpm{
       /* background-color: DodgerBlue; */
        border: none;
     /*   color: DodgerBlue; */
        color: #ff1e1e;
        padding: 12px 30px;
        cursor: pointer;
        font-size: 20px;
        border-width: 3px;
        border-style: solid;
     /*   border-color: #0b86ff; */
        border-color: #ff0b0b;
        box-shadow: #333333;
    }

    #LinuxDownloadButtonrpm:hover{
        color: white;
    /*    background-color: rgba(0,24,255,0.76); */
        background-color: rgba(255, 0, 0, 0.76);
        transition-delay: 5ms;
        transition-duration: 20ms;
    }

    #LinuxDownloadButtondeb{
        /* background-color: DodgerBlue; */
        border: none;
    /*    color: DodgerBlue; */
        color: #ff1e1e;
        padding: 12px 30px;
        cursor: pointer;
        font-size: 20px;
        border-width: 3px;
        border-style: solid;
     /*   border-color: #0b86ff; */
        border-color: #ff0b0b;
        box-shadow: #333333;
    }

    #LinuxDownloadButtondeb:hover{
        color: white;
      /*  background-color: rgba(0,24,255,0.76); */
        background-color: rgba(255, 0, 0, 0.76);
        transition-delay: 5ms;
        transition-duration: 20ms;
    }

    .WindowsDownload{
        /*   width: 20rem;
           height: 18rem; */
        border-color: rgba(29, 217, 17, 0.76);
        border-width: 3px;
        border-style: solid;
    }

    .WindowsDownloadHead{
        text-align: center;
    }

    .WindowsDownloadBody{
        text-align: center;
    }
    #WindowsDownloadButton{
       /* background-color: DodgerBlue; */
        border: none;
        color: DodgerBlue;
        padding: 12px 30px;
        cursor: pointer;
        font-size: 20px;
        border-width: 3px;
        border-style: solid;
        border-color: #0b86ff;
        box-shadow: #333333;
    }
    #WindowsDownloadButton:hover{
        color: white;
        background-color: rgba(0,24,255,0.76);
        transition-delay: 5ms;
        transition-duration: 20ms;
    }

</style>

<!-- HTML STARTS HERE -->

<div id="disclaimer">
    <p></p>
</div>

<div id="WholeDownload">

    <div class="MacDownload">
        <div class="MacosDownloadHead">
            <h1 class="titleBody">Mac OSX Download</h1>
        </div>
        <div class="MacosDownloadBody">
            <p class="contentBody">Nitlyn File Compressor v 1.0</p>
            <a id="MacDownloadButton" href={macdwnld} download>Download</a>
        </div>

    </div>


    <div class="LinuxDownload">
        <div class="LinuxDownloadHead">
            <h1 class="titleBody">Linux Download</h1>
        </div>
        <div class="LinuxDownloadBody">
            <p class="contentBody">Nitlyn File Compressor v 1.0</p>
            <p>{deberr}</p>
            <p>{rpmerr}</p>
            <a on:click={debOnclick} id="LinuxDownloadButtondeb" href={linuxdwnlddeb} download>.deb</a>
            <a on:click={rpmOnclick} id="LinuxDownloadButtonrpm" href={linuxdwnldrpm} download>.rpm</a>
        </div>

    </div>



    <div class="WindowsDownload">
        <div class="WindowsDownloadHead">
            <h1 class="titleBody">Windows Download</h1>
        </div>
        <div class="WindowsDownloadBody">
            <p class="contentBody">Nitlyn File Compressor v 1.0</p>
            <a id="WindowsDownloadButton" href={windowsdwnld} download>Download</a>
        </div>

    </div>

</div>
