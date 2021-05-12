
<script>
    import { onMount } from "svelte";

    let showMobileMenu = false;

    const navItems = [
        {label: "Home", href: "/"},
        {label: "About", href: "about"},
        {label: "Our Team", href: "ourteam"}
    ];

    const handleMIC = () => (showMobileMenu = !showMobileMenu);

    const mediaQH = e => {
        if (!e.matches) {
            showMobileMenu = false;
        }
    };

    onMount(() => {
        const mediaListener = window.matchMedia("(max-width: 767px)");
        mediaListener.addListener(mediaQH);
    });

</script>

<!-- Element Tag GOES HERE -->
<svelte:options tag="navi-bar" />

<!-- CSS STARTS HERE -->
<style>
    nav {
        border: #0b86ff solid 3px;
        font-family: "Helvetica Neue", "Helvetica", "Arial", sans-serif;
        height: 45px;
    }

    .inner {
        max-width: 980px;
        padding-left: 20px;
        padding-right: 20px;
        margin: auto;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        height: 100%;
    }

    .mobile-icon {
        width: 25px;
        height: 14px;
        position: relative;
        cursor: pointer;
    }

    .mobile-icon:after,
    .mobile-icon:before,
    .middle-line {
        content: "";
        position: absolute;
        width: 100%;
        height: 2px;
        background-color: #0b86ff;
        transition: all 0.4s;
        transform-origin: center;
    }

    .mobile-icon:before,
    .middle-line {
        top: 0;
    }

    .mobile-icon:after,
    .middle-line {
        bottom: 0;
    }

    .mobile-icon:before {
        width: 66%;
    }

    .mobile-icon:after {
        width: 33%;
    }

    .middle-line {
        margin: auto;
    }

    .mobile-icon:hover:before,
    .mobile-icon:hover:after,
    .mobile-icon.active:before,
    .mobile-icon.active:after,
    .mobile-icon.active .middle-line {
        width: 100%;
    }

    .mobile-icon.active:before,
    .mobile-icon.active:after {
        top: 50%;
        transform: rotate(-45deg);
    }

    .mobile-icon.active .middle-line {
        transform: rotate(45deg);
    }

    .navbar-list {
        display: none;
        width: 100%;
        justify-content: space-between;
        margin: 0;
        padding: 0 40px;
    }

    .navbar-list.mobile {
        background-color: #0b86ff;
        position: fixed;
        display: block;
        height: calc(100% - 45px);
        bottom: 0;
        left: 0;
    }

    .navbar-list li {
        list-style-type: none;
        position: relative;
    }

    .navbar-list li:before {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
    }

    .navbar-list a {
        color: #0b86ff;
        text-decoration: none;
        display: flex;
        height: 45px;
        align-items: center;
        padding: 0 10px;
        font-size: 13px;
    }

    @media only screen and (min-width: 767px) {
        .mobile-icon {
            display: none;
        }

        .navbar-list {
            display: flex;
            padding: 0;
        }

        .navbar-list a {
            display: inline-flex;
        }
    }


</style>

<!-- HTML STARTS HERE -->

<nav>
    <div class="inner">
        <div on:click={handleMIC} class={`mobile-icon${showMobileMenu ? 'active' : ''}`}>
            <div class="middle-line"></div>
        </div>
        <ul class={`navbar-list${showMobileMenu ? 'mobile' : ''}`}>
            {#each navItems as item}
                <li>
                    <a href={item.href}>{item.label}</a>
                </li>
            {/each }
        </ul>
    </div>
</nav>

