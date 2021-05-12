
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                const { on_mount } = this.$$;
                this.$$.on_disconnect = on_mount.map(run).filter(is_function);
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            disconnectedCallback() {
                run_all(this.$$.on_disconnect);
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    /* src\content\NavBar.svelte generated by Svelte v3.37.0 */
    const file$7 = "src\\content\\NavBar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (176:12) {#each navItems as item}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[4].label + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", /*item*/ ctx[4].href);
    			add_location(a, file$7, 177, 20, 3543);
    			add_location(li, file$7, 176, 16, 3518);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(176:12) {#each navItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let nav;
    	let div2;
    	let div1;
    	let div0;
    	let div1_class_value;
    	let t;
    	let ul;
    	let ul_class_value;
    	let mounted;
    	let dispose;
    	let each_value = /*navItems*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(div0, "class", "middle-line");
    			add_location(div0, file$7, 172, 12, 3350);
    			attr_dev(div1, "class", div1_class_value = `mobile-icon${/*showMobileMenu*/ ctx[0] ? "active" : ""}`);
    			add_location(div1, file$7, 171, 8, 3256);
    			attr_dev(ul, "class", ul_class_value = `navbar-list${/*showMobileMenu*/ ctx[0] ? "mobile" : ""}`);
    			add_location(ul, file$7, 174, 8, 3405);
    			attr_dev(div2, "class", "inner");
    			add_location(div2, file$7, 170, 4, 3228);
    			add_location(nav, file$7, 169, 0, 3218);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div2, t);
    			append_dev(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*handleMIC*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*showMobileMenu*/ 1 && div1_class_value !== (div1_class_value = `mobile-icon${/*showMobileMenu*/ ctx[0] ? "active" : ""}`)) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*navItems*/ 2) {
    				each_value = /*navItems*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showMobileMenu*/ 1 && ul_class_value !== (ul_class_value = `navbar-list${/*showMobileMenu*/ ctx[0] ? "mobile" : ""}`)) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("navi-bar", slots, []);
    	let showMobileMenu = false;

    	const navItems = [
    		{ label: "Home", href: "/" },
    		{ label: "About", href: "about" },
    		{ label: "Our Team", href: "ourteam" }
    	];

    	const handleMIC = () => $$invalidate(0, showMobileMenu = !showMobileMenu);

    	const mediaQH = e => {
    		if (!e.matches) {
    			$$invalidate(0, showMobileMenu = false);
    		}
    	};

    	onMount(() => {
    		const mediaListener = window.matchMedia("(max-width: 767px)");
    		mediaListener.addListener(mediaQH);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<navi-bar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		showMobileMenu,
    		navItems,
    		handleMIC,
    		mediaQH
    	});

    	$$self.$inject_state = $$props => {
    		if ("showMobileMenu" in $$props) $$invalidate(0, showMobileMenu = $$props.showMobileMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showMobileMenu, navItems, handleMIC];
    }

    class NavBar extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>nav{border:#0b86ff solid 3px;font-family:"Helvetica Neue", "Helvetica", "Arial", sans-serif;height:45px}.inner{max-width:980px;padding-left:20px;padding-right:20px;margin:auto;box-sizing:border-box;display:flex;align-items:center;height:100%}.mobile-icon{width:25px;height:14px;position:relative;cursor:pointer}.mobile-icon:after,.mobile-icon:before,.middle-line{content:"";position:absolute;width:100%;height:2px;background-color:#0b86ff;transition:all 0.4s;transform-origin:center}.mobile-icon:before,.middle-line{top:0}.mobile-icon:after,.middle-line{bottom:0}.mobile-icon:before{width:66%}.mobile-icon:after{width:33%}.middle-line{margin:auto}.mobile-icon:hover:before,.mobile-icon:hover:after,.mobile-icon.active:before,.mobile-icon.active:after,.mobile-icon.active .middle-line{width:100%}.mobile-icon.active:before,.mobile-icon.active:after{top:50%;transform:rotate(-45deg)}.mobile-icon.active .middle-line{transform:rotate(45deg)}.navbar-list{display:none;width:100%;justify-content:space-between;margin:0;padding:0 40px}.navbar-list.mobile{background-color:#0b86ff;position:fixed;display:block;height:calc(100% - 45px);bottom:0;left:0}.navbar-list li{list-style-type:none;position:relative}.navbar-list li:before{content:"";position:absolute;bottom:0;left:0;width:100%;height:1px}.navbar-list a{color:#0b86ff;text-decoration:none;display:flex;height:45px;align-items:center;padding:0 10px;font-size:13px}@media only screen and (min-width: 767px){.mobile-icon{display:none}.navbar-list{display:flex;padding:0}.navbar-list a{display:inline-flex}}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("navi-bar", NavBar);

    /* src\content\Downloads.svelte generated by Svelte v3.37.0 */

    const file$6 = "src\\content\\Downloads.svelte";

    function create_fragment$6(ctx) {
    	let div0;
    	let p0;
    	let t0;
    	let div10;
    	let div3;
    	let div1;
    	let h10;
    	let t2;
    	let div2;
    	let p1;
    	let t4;
    	let a0;
    	let t5;
    	let t6;
    	let div6;
    	let div4;
    	let h11;
    	let t8;
    	let div5;
    	let p2;
    	let t10;
    	let p3;
    	let t11;
    	let t12;
    	let p4;
    	let t13;
    	let t14;
    	let a1;
    	let t15;
    	let t16;
    	let a2;
    	let t17;
    	let t18;
    	let div9;
    	let div7;
    	let h12;
    	let t20;
    	let div8;
    	let p5;
    	let t22;
    	let a3;
    	let t23;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p0 = element("p");
    			t0 = space();
    			div10 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Mac OSX Download";
    			t2 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "Nitlyn File Compressor v 1.0";
    			t4 = space();
    			a0 = element("a");
    			t5 = text("Download");
    			t6 = space();
    			div6 = element("div");
    			div4 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Linux Download";
    			t8 = space();
    			div5 = element("div");
    			p2 = element("p");
    			p2.textContent = "Nitlyn File Compressor v 1.0";
    			t10 = space();
    			p3 = element("p");
    			t11 = text(/*deberr*/ ctx[4]);
    			t12 = space();
    			p4 = element("p");
    			t13 = text(/*rpmerr*/ ctx[5]);
    			t14 = space();
    			a1 = element("a");
    			t15 = text(".deb");
    			t16 = space();
    			a2 = element("a");
    			t17 = text(".rpm");
    			t18 = space();
    			div9 = element("div");
    			div7 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Windows Download";
    			t20 = space();
    			div8 = element("div");
    			p5 = element("p");
    			p5.textContent = "Nitlyn File Compressor v 1.0";
    			t22 = space();
    			a3 = element("a");
    			t23 = text("Download");
    			this.c = noop;
    			add_location(p0, file$6, 172, 4, 4177);
    			attr_dev(div0, "id", "disclaimer");
    			add_location(div0, file$6, 171, 0, 4151);
    			attr_dev(h10, "class", "titleBody");
    			add_location(h10, file$6, 179, 12, 4301);
    			attr_dev(div1, "class", "MacosDownloadHead");
    			add_location(div1, file$6, 178, 8, 4257);
    			attr_dev(p1, "class", "contentBody");
    			add_location(p1, file$6, 182, 12, 4412);
    			attr_dev(a0, "id", "MacDownloadButton");
    			attr_dev(a0, "href", /*macdwnld*/ ctx[0]);
    			attr_dev(a0, "download", "");
    			add_location(a0, file$6, 183, 12, 4480);
    			attr_dev(div2, "class", "MacosDownloadBody");
    			add_location(div2, file$6, 181, 8, 4368);
    			attr_dev(div3, "class", "MacDownload");
    			add_location(div3, file$6, 177, 4, 4223);
    			attr_dev(h11, "class", "titleBody");
    			add_location(h11, file$6, 191, 12, 4657);
    			attr_dev(div4, "class", "LinuxDownloadHead");
    			add_location(div4, file$6, 190, 8, 4613);
    			attr_dev(p2, "class", "contentBody");
    			add_location(p2, file$6, 194, 12, 4766);
    			add_location(p3, file$6, 195, 12, 4834);
    			add_location(p4, file$6, 196, 12, 4862);
    			attr_dev(a1, "id", "LinuxDownloadButtondeb");
    			attr_dev(a1, "href", /*linuxdwnlddeb*/ ctx[1]);
    			attr_dev(a1, "download", "");
    			add_location(a1, file$6, 197, 12, 4890);
    			attr_dev(a2, "id", "LinuxDownloadButtonrpm");
    			attr_dev(a2, "href", /*linuxdwnldrpm*/ ctx[2]);
    			attr_dev(a2, "download", "");
    			add_location(a2, file$6, 198, 12, 4994);
    			attr_dev(div5, "class", "LinuxDownloadBody");
    			add_location(div5, file$6, 193, 8, 4722);
    			attr_dev(div6, "class", "LinuxDownload");
    			add_location(div6, file$6, 189, 4, 4577);
    			attr_dev(h12, "class", "titleBody");
    			add_location(h12, file$6, 207, 12, 5204);
    			attr_dev(div7, "class", "WindowsDownloadHead");
    			add_location(div7, file$6, 206, 8, 5158);
    			attr_dev(p5, "class", "contentBody");
    			add_location(p5, file$6, 210, 12, 5317);
    			attr_dev(a3, "id", "WindowsDownloadButton");
    			attr_dev(a3, "href", /*windowsdwnld*/ ctx[3]);
    			attr_dev(a3, "download", "");
    			add_location(a3, file$6, 211, 12, 5385);
    			attr_dev(div8, "class", "WindowsDownloadBody");
    			add_location(div8, file$6, 209, 8, 5271);
    			attr_dev(div9, "class", "WindowsDownload");
    			add_location(div9, file$6, 205, 4, 5120);
    			attr_dev(div10, "id", "WholeDownload");
    			add_location(div10, file$6, 175, 0, 4193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h10);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    			append_dev(div2, t4);
    			append_dev(div2, a0);
    			append_dev(a0, t5);
    			append_dev(div10, t6);
    			append_dev(div10, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h11);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, p2);
    			append_dev(div5, t10);
    			append_dev(div5, p3);
    			append_dev(p3, t11);
    			append_dev(div5, t12);
    			append_dev(div5, p4);
    			append_dev(p4, t13);
    			append_dev(div5, t14);
    			append_dev(div5, a1);
    			append_dev(a1, t15);
    			append_dev(div5, t16);
    			append_dev(div5, a2);
    			append_dev(a2, t17);
    			append_dev(div10, t18);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h12);
    			append_dev(div9, t20);
    			append_dev(div9, div8);
    			append_dev(div8, p5);
    			append_dev(div8, t22);
    			append_dev(div8, a3);
    			append_dev(a3, t23);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a1, "click", debOnclick, false, false, false),
    					listen_dev(a2, "click", rpmOnclick, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*macdwnld*/ 1) {
    				attr_dev(a0, "href", /*macdwnld*/ ctx[0]);
    			}

    			if (dirty & /*deberr*/ 16) set_data_dev(t11, /*deberr*/ ctx[4]);
    			if (dirty & /*rpmerr*/ 32) set_data_dev(t13, /*rpmerr*/ ctx[5]);

    			if (dirty & /*linuxdwnlddeb*/ 2) {
    				attr_dev(a1, "href", /*linuxdwnlddeb*/ ctx[1]);
    			}

    			if (dirty & /*linuxdwnldrpm*/ 4) {
    				attr_dev(a2, "href", /*linuxdwnldrpm*/ ctx[2]);
    			}

    			if (dirty & /*windowsdwnld*/ 8) {
    				attr_dev(a3, "href", /*windowsdwnld*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function debOnclick() {
    	alert("We are sorry our .deb files arent working at the moment try again later");
    }

    function rpmOnclick() {
    	alert("We are sorry our .rpm files arent working at the moment try again later");
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("download-fc", slots, []);
    	let { macdwnld = "Default" } = $$props;
    	let { linuxdwnlddeb } = $$props; // Change Later
    	let { linuxdwnldrpm } = $$props; // Change Later
    	let { windowsdwnld = "Default" } = $$props;
    	let { deberr = "" } = $$props;
    	let { rpmerr = "" } = $$props;

    	const writable_props = [
    		"macdwnld",
    		"linuxdwnlddeb",
    		"linuxdwnldrpm",
    		"windowsdwnld",
    		"deberr",
    		"rpmerr"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<download-fc> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("macdwnld" in $$props) $$invalidate(0, macdwnld = $$props.macdwnld);
    		if ("linuxdwnlddeb" in $$props) $$invalidate(1, linuxdwnlddeb = $$props.linuxdwnlddeb);
    		if ("linuxdwnldrpm" in $$props) $$invalidate(2, linuxdwnldrpm = $$props.linuxdwnldrpm);
    		if ("windowsdwnld" in $$props) $$invalidate(3, windowsdwnld = $$props.windowsdwnld);
    		if ("deberr" in $$props) $$invalidate(4, deberr = $$props.deberr);
    		if ("rpmerr" in $$props) $$invalidate(5, rpmerr = $$props.rpmerr);
    	};

    	$$self.$capture_state = () => ({
    		macdwnld,
    		linuxdwnlddeb,
    		linuxdwnldrpm,
    		windowsdwnld,
    		deberr,
    		rpmerr,
    		debOnclick,
    		rpmOnclick
    	});

    	$$self.$inject_state = $$props => {
    		if ("macdwnld" in $$props) $$invalidate(0, macdwnld = $$props.macdwnld);
    		if ("linuxdwnlddeb" in $$props) $$invalidate(1, linuxdwnlddeb = $$props.linuxdwnlddeb);
    		if ("linuxdwnldrpm" in $$props) $$invalidate(2, linuxdwnldrpm = $$props.linuxdwnldrpm);
    		if ("windowsdwnld" in $$props) $$invalidate(3, windowsdwnld = $$props.windowsdwnld);
    		if ("deberr" in $$props) $$invalidate(4, deberr = $$props.deberr);
    		if ("rpmerr" in $$props) $$invalidate(5, rpmerr = $$props.rpmerr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [macdwnld, linuxdwnlddeb, linuxdwnldrpm, windowsdwnld, deberr, rpmerr];
    }

    class Downloads extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>#WholeDownload{display:grid;gap:1rem;margin-top:10rem;grid-template-columns:repeat(3, 1fr);grid-template-columns:repeat(3, minmax(20rem, 1fr));grid-template-columns:repeat(auto-fit, minmax(20rem, 1fr))}.MacDownload:hover{}.MacDownload{border-color:rgba(29, 217, 17, 0.76);border-width:3px;border-style:solid}.MacosDownloadHead{text-align:center}.MacosDownloadBody{text-align:center}#MacDownloadButton{border:none;color:DodgerBlue;padding:12px 30px;cursor:pointer;font-size:20px;border-width:3px;border-style:solid;border-color:#0b86ff;box-shadow:#333333}#MacDownloadButton:hover{color:white;background-color:rgba(0,24,255,0.76);transition-delay:5ms;transition-duration:20ms}.LinuxDownload{border-color:rgba(29, 217, 17, 0.76);border-width:3px;border-style:solid}.LinuxDownloadHead{text-align:center}.LinuxDownloadBody{text-align:center}#LinuxDownloadButtonrpm{border:none;color:#ff1e1e;padding:12px 30px;cursor:pointer;font-size:20px;border-width:3px;border-style:solid;border-color:#ff0b0b;box-shadow:#333333}#LinuxDownloadButtonrpm:hover{color:white;background-color:rgba(255, 0, 0, 0.76);transition-delay:5ms;transition-duration:20ms}#LinuxDownloadButtondeb{border:none;color:#ff1e1e;padding:12px 30px;cursor:pointer;font-size:20px;border-width:3px;border-style:solid;border-color:#ff0b0b;box-shadow:#333333}#LinuxDownloadButtondeb:hover{color:white;background-color:rgba(255, 0, 0, 0.76);transition-delay:5ms;transition-duration:20ms}.WindowsDownload{border-color:rgba(29, 217, 17, 0.76);border-width:3px;border-style:solid}.WindowsDownloadHead{text-align:center}.WindowsDownloadBody{text-align:center}#WindowsDownloadButton{border:none;color:DodgerBlue;padding:12px 30px;cursor:pointer;font-size:20px;border-width:3px;border-style:solid;border-color:#0b86ff;box-shadow:#333333}#WindowsDownloadButton:hover{color:white;background-color:rgba(0,24,255,0.76);transition-delay:5ms;transition-duration:20ms}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				macdwnld: 0,
    				linuxdwnlddeb: 1,
    				linuxdwnldrpm: 2,
    				windowsdwnld: 3,
    				deberr: 4,
    				rpmerr: 5
    			}
    		);

    		const { ctx } = this.$$;
    		const props = this.attributes;

    		if (/*linuxdwnlddeb*/ ctx[1] === undefined && !("linuxdwnlddeb" in props)) {
    			console.warn("<download-fc> was created without expected prop 'linuxdwnlddeb'");
    		}

    		if (/*linuxdwnldrpm*/ ctx[2] === undefined && !("linuxdwnldrpm" in props)) {
    			console.warn("<download-fc> was created without expected prop 'linuxdwnldrpm'");
    		}

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return [
    			"macdwnld",
    			"linuxdwnlddeb",
    			"linuxdwnldrpm",
    			"windowsdwnld",
    			"deberr",
    			"rpmerr"
    		];
    	}

    	get macdwnld() {
    		return this.$$.ctx[0];
    	}

    	set macdwnld(macdwnld) {
    		this.$set({ macdwnld });
    		flush();
    	}

    	get linuxdwnlddeb() {
    		return this.$$.ctx[1];
    	}

    	set linuxdwnlddeb(linuxdwnlddeb) {
    		this.$set({ linuxdwnlddeb });
    		flush();
    	}

    	get linuxdwnldrpm() {
    		return this.$$.ctx[2];
    	}

    	set linuxdwnldrpm(linuxdwnldrpm) {
    		this.$set({ linuxdwnldrpm });
    		flush();
    	}

    	get windowsdwnld() {
    		return this.$$.ctx[3];
    	}

    	set windowsdwnld(windowsdwnld) {
    		this.$set({ windowsdwnld });
    		flush();
    	}

    	get deberr() {
    		return this.$$.ctx[4];
    	}

    	set deberr(deberr) {
    		this.$set({ deberr });
    		flush();
    	}

    	get rpmerr() {
    		return this.$$.ctx[5];
    	}

    	set rpmerr(rpmerr) {
    		this.$set({ rpmerr });
    		flush();
    	}
    }

    customElements.define("download-fc", Downloads);

    /* src\content\Footer.svelte generated by Svelte v3.37.0 */
    const file$5 = "src\\content\\Footer.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (183:12) {#each navItems as item}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[4].label + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", /*item*/ ctx[4].href);
    			add_location(a, file$5, 184, 20, 3743);
    			add_location(li, file$5, 183, 16, 3718);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(183:12) {#each navItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let nav;
    	let div2;
    	let div1;
    	let div0;
    	let div1_class_value;
    	let t0;
    	let p;
    	let t2;
    	let ul;
    	let ul_class_value;
    	let mounted;
    	let dispose;
    	let each_value = /*navItems*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			p = element("p");
    			p.textContent = "© NitLyn 2021 co";
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(div0, "class", "middle-line");
    			add_location(div0, file$5, 178, 12, 3501);
    			attr_dev(div1, "class", div1_class_value = `mobile-icon${/*showMobileMenu*/ ctx[0] ? "active" : ""}`);
    			add_location(div1, file$5, 177, 8, 3407);
    			attr_dev(p, "class", "cpy");
    			add_location(p, file$5, 180, 8, 3556);
    			attr_dev(ul, "class", ul_class_value = `navbar-list${/*showMobileMenu*/ ctx[0] ? "mobile" : ""}`);
    			add_location(ul, file$5, 181, 8, 3605);
    			attr_dev(div2, "class", "inner");
    			add_location(div2, file$5, 176, 4, 3379);
    			add_location(nav, file$5, 175, 0, 3369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div2, t0);
    			append_dev(div2, p);
    			append_dev(div2, t2);
    			append_dev(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*handleMIC*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*showMobileMenu*/ 1 && div1_class_value !== (div1_class_value = `mobile-icon${/*showMobileMenu*/ ctx[0] ? "active" : ""}`)) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*navItems*/ 2) {
    				each_value = /*navItems*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showMobileMenu*/ 1 && ul_class_value !== (ul_class_value = `navbar-list${/*showMobileMenu*/ ctx[0] ? "mobile" : ""}`)) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("footer-nav", slots, []);
    	let showMobileMenu = false;

    	const navItems = [
    		{ label: "Home", href: "/" },
    		{ label: "About", href: "about" },
    		{ label: "Our Team", href: "ourteam" },
    		{ label: "FAQ", href: "faq" }
    	];

    	const handleMIC = () => $$invalidate(0, showMobileMenu = !showMobileMenu);

    	const mediaQH = e => {
    		if (!e.matches) {
    			$$invalidate(0, showMobileMenu = false);
    		}
    	};

    	onMount(() => {
    		const mediaListener = window.matchMedia("(max-width: 767px)");
    		mediaListener.addListener(mediaQH);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<footer-nav> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		showMobileMenu,
    		navItems,
    		handleMIC,
    		mediaQH
    	});

    	$$self.$inject_state = $$props => {
    		if ("showMobileMenu" in $$props) $$invalidate(0, showMobileMenu = $$props.showMobileMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showMobileMenu, navItems, handleMIC];
    }

    class Footer extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>nav{border:#e70bff solid 3px;font-family:"Helvetica Neue", "Helvetica", "Arial", sans-serif;height:45px;margin-top:9rem}.inner{max-width:980px;padding-left:20px;padding-right:20px;margin:auto;box-sizing:border-box;display:flex;align-items:center;height:100%}.mobile-icon{width:25px;height:14px;position:relative;cursor:pointer}.mobile-icon:after,.mobile-icon:before,.middle-line{content:"";position:absolute;width:100%;height:2px;background-color:#e70bff;transition:all 0.4s;transform-origin:center}.mobile-icon:before,.middle-line{top:0}.mobile-icon:after,.middle-line{bottom:0}.mobile-icon:before{width:66%}.mobile-icon:after{width:33%}.middle-line{margin:auto}.mobile-icon:hover:before,.mobile-icon:hover:after,.mobile-icon.active:before,.mobile-icon.active:after,.mobile-icon.active .middle-line{width:100%}.mobile-icon.active:before,.mobile-icon.active:after{top:50%;transform:rotate(-45deg)}.mobile-icon.active .middle-line{transform:rotate(45deg)}.navbar-list{display:none;width:100%;margin:0 -10rem;padding:0 40px}.navbar-list.mobile{background-color:#0b86ff;position:fixed;display:block;height:calc(100% - 45px);bottom:0;left:0}.navbar-list li{list-style-type:none;position:relative}.navbar-list li:before{content:"";position:absolute;bottom:0;left:0;width:100%;height:1px}.navbar-list a{color:#e70bff;text-decoration:none;display:flex;height:45px;align-items:center;padding:0 10px;font-size:13px}.cpy{position:absolute;right:50px;font-size:13px}@media only screen and (min-width: 767px){.mobile-icon{display:none}.navbar-list{display:flex;padding:0}.navbar-list a{display:inline-flex}}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("footer-nav", Footer);

    /* src\content\Ourteam.svelte generated by Svelte v3.37.0 */

    const file$4 = "src\\content\\Ourteam.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let fieldset0;
    	let legend0;
    	let b0;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let p4;
    	let t11;
    	let fieldset1;
    	let legend1;
    	let b1;
    	let t13;
    	let p5;
    	let t15;
    	let p6;
    	let t17;
    	let p7;
    	let t19;
    	let p8;
    	let t21;
    	let fieldset2;
    	let legend2;
    	let b2;
    	let t23;
    	let p9;
    	let t25;
    	let p10;
    	let t27;
    	let p11;
    	let t29;
    	let fieldset3;
    	let legend3;
    	let b3;
    	let t31;
    	let p12;
    	let t33;
    	let p13;
    	let t35;
    	let p14;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			fieldset0 = element("fieldset");
    			legend0 = element("legend");
    			b0 = element("b");
    			b0.textContent = "Julian Pitterson";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Joined : February, 9 2020";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Founder";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "C.E.O";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Lead Developer";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "Own's 50% Of KFC";
    			t11 = space();
    			fieldset1 = element("fieldset");
    			legend1 = element("legend");
    			b1 = element("b");
    			b1.textContent = "James Allen Batara";
    			t13 = space();
    			p5 = element("p");
    			p5.textContent = "Joined : February, 9 2020";
    			t15 = space();
    			p6 = element("p");
    			p6.textContent = "Co-Founder";
    			t17 = space();
    			p7 = element("p");
    			p7.textContent = "C.T.O";
    			t19 = space();
    			p8 = element("p");
    			p8.textContent = "Owns 3,500 Rice Farms In Asia";
    			t21 = space();
    			fieldset2 = element("fieldset");
    			legend2 = element("legend");
    			b2 = element("b");
    			b2.textContent = "Ryan George";
    			t23 = space();
    			p9 = element("p");
    			p9.textContent = "Joined : April, 5 2020";
    			t25 = space();
    			p10 = element("p");
    			p10.textContent = "Developer";
    			t27 = space();
    			p11 = element("p");
    			p11.textContent = "The World's Most Wanted Terrorist";
    			t29 = space();
    			fieldset3 = element("fieldset");
    			legend3 = element("legend");
    			b3 = element("b");
    			b3.textContent = "Darwin Garcia";
    			t31 = space();
    			p12 = element("p");
    			p12.textContent = "Joined : June, 5 2020";
    			t33 = space();
    			p13 = element("p");
    			p13.textContent = "Developer";
    			t35 = space();
    			p14 = element("p");
    			p14.textContent = "El Chapo's Son";
    			this.c = noop;
    			add_location(b0, file$4, 38, 42, 678);
    			attr_dev(legend0, "class", "legend-titles");
    			add_location(legend0, file$4, 38, 12, 648);
    			add_location(p0, file$4, 39, 12, 723);
    			add_location(p1, file$4, 40, 12, 768);
    			add_location(p2, file$4, 41, 12, 795);
    			add_location(p3, file$4, 42, 12, 820);
    			add_location(p4, file$4, 43, 12, 854);
    			attr_dev(fieldset0, "id", "1-fieldset");
    			attr_dev(fieldset0, "class", "ot-fieldset");
    			add_location(fieldset0, file$4, 37, 8, 589);
    			add_location(b1, file$4, 46, 42, 995);
    			attr_dev(legend1, "class", "legend-titles");
    			add_location(legend1, file$4, 46, 12, 965);
    			add_location(p5, file$4, 47, 12, 1042);
    			add_location(p6, file$4, 48, 12, 1087);
    			add_location(p7, file$4, 49, 12, 1117);
    			add_location(p8, file$4, 50, 12, 1142);
    			attr_dev(fieldset1, "id", "2-fieldset");
    			attr_dev(fieldset1, "class", "ot-fieldset");
    			add_location(fieldset1, file$4, 45, 8, 906);
    			add_location(b2, file$4, 53, 42, 1296);
    			attr_dev(legend2, "class", "legend-titles");
    			add_location(legend2, file$4, 53, 12, 1266);
    			add_location(p9, file$4, 54, 12, 1336);
    			add_location(p10, file$4, 55, 12, 1378);
    			add_location(p11, file$4, 56, 12, 1407);
    			attr_dev(fieldset2, "id", "3-fieldset");
    			attr_dev(fieldset2, "class", "ot-fieldset");
    			add_location(fieldset2, file$4, 52, 8, 1207);
    			add_location(b3, file$4, 59, 42, 1565);
    			attr_dev(legend3, "class", "legend-titles");
    			add_location(legend3, file$4, 59, 12, 1535);
    			add_location(p12, file$4, 60, 12, 1607);
    			add_location(p13, file$4, 61, 12, 1648);
    			add_location(p14, file$4, 62, 12, 1677);
    			attr_dev(fieldset3, "id", "4-fieldset");
    			attr_dev(fieldset3, "class", "ot-fieldset");
    			add_location(fieldset3, file$4, 58, 8, 1476);
    			attr_dev(div0, "id", "the-people");
    			add_location(div0, file$4, 36, 4, 559);
    			attr_dev(div1, "id", "ourteam-whole");
    			add_location(div1, file$4, 35, 0, 530);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, fieldset0);
    			append_dev(fieldset0, legend0);
    			append_dev(legend0, b0);
    			append_dev(fieldset0, t1);
    			append_dev(fieldset0, p0);
    			append_dev(fieldset0, t3);
    			append_dev(fieldset0, p1);
    			append_dev(fieldset0, t5);
    			append_dev(fieldset0, p2);
    			append_dev(fieldset0, t7);
    			append_dev(fieldset0, p3);
    			append_dev(fieldset0, t9);
    			append_dev(fieldset0, p4);
    			append_dev(div0, t11);
    			append_dev(div0, fieldset1);
    			append_dev(fieldset1, legend1);
    			append_dev(legend1, b1);
    			append_dev(fieldset1, t13);
    			append_dev(fieldset1, p5);
    			append_dev(fieldset1, t15);
    			append_dev(fieldset1, p6);
    			append_dev(fieldset1, t17);
    			append_dev(fieldset1, p7);
    			append_dev(fieldset1, t19);
    			append_dev(fieldset1, p8);
    			append_dev(div0, t21);
    			append_dev(div0, fieldset2);
    			append_dev(fieldset2, legend2);
    			append_dev(legend2, b2);
    			append_dev(fieldset2, t23);
    			append_dev(fieldset2, p9);
    			append_dev(fieldset2, t25);
    			append_dev(fieldset2, p10);
    			append_dev(fieldset2, t27);
    			append_dev(fieldset2, p11);
    			append_dev(div0, t29);
    			append_dev(div0, fieldset3);
    			append_dev(fieldset3, legend3);
    			append_dev(legend3, b3);
    			append_dev(fieldset3, t31);
    			append_dev(fieldset3, p12);
    			append_dev(fieldset3, t33);
    			append_dev(fieldset3, p13);
    			append_dev(fieldset3, t35);
    			append_dev(fieldset3, p14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("our-team", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<our-team> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Ourteam extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>#ourteam-whole{padding-top:2rem}#the-people{display:grid;gap:1.5rem;grid-template-columns:repeat(4, 1fr);grid-template-columns:repeat(4, minmax(20rem, 1fr));grid-template-columns:repeat(auto-fit, minmax(20rem, 1fr))}.ot-fieldset{border:3px solid rgba(29, 217, 17, 0.76)}.legend-titles{}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("our-team", Ourteam);

    /* src\content\About.svelte generated by Svelte v3.37.0 */

    const file$3 = "src\\content\\About.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let fieldset2;
    	let legend0;
    	let b0;
    	let t1;
    	let h2;
    	let t3;
    	let div0;
    	let p0;
    	let t4;
    	let i;
    	let t6;
    	let t7;
    	let fieldset0;
    	let legend1;
    	let b1;
    	let t9;
    	let p1;
    	let t11;
    	let br;
    	let t12;
    	let fieldset1;
    	let legend2;
    	let b2;
    	let t14;
    	let p2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			fieldset2 = element("fieldset");
    			legend0 = element("legend");
    			b0 = element("b");
    			b0.textContent = "About";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "About NitLyn's File Compressor";
    			t3 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t4 = text("NOTE: this version of NitLyn is a very ");
    			i = element("i");
    			i.textContent = "skinned down version";
    			t6 = text(" of NitLyn's FC (File Compressor)");
    			t7 = space();
    			fieldset0 = element("fieldset");
    			legend1 = element("legend");
    			b1 = element("b");
    			b1.textContent = "Compression";
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Nitlyn is a lossless compression application that allows its user to compress files without changes in quality of pictures or videos using their lossless compression alogrithm. Nitlyn is a multi platform based on computer only (for the time being). NitLyn's FC allows its users send files directly to Discord, because of Discords 8.00mb Limit. No Need For Nitro!";
    			t11 = space();
    			br = element("br");
    			t12 = space();
    			fieldset1 = element("fieldset");
    			legend2 = element("legend");
    			b2 = element("b");
    			b2.textContent = "NitLyn's History";
    			t14 = space();
    			p2 = element("p");
    			p2.textContent = "Nitlyn started out as a video streaming service however it changed its business model to lossless compression after many problems with bandwidth. It was started back in February 9th, 2020 with the name “Dateify” it was later changed to “Nitlyn” after the domain was already registered, the first design was made in a french class by 2 friends Julian Pitterson the C.E.O, and James Allen Batara the C.T.O. 5 people were asked to join Nitlyn, one declined however the other 4 accepted, 2 of those people were Ryan George and Darwin Garcia, (the developers). The other 2 people were fired due to lack of contribution and not enough dedication.";
    			this.c = noop;
    			add_location(b0, file$3, 28, 16, 416);
    			add_location(legend0, file$3, 28, 8, 408);
    			attr_dev(h2, "class", "abt-title");
    			add_location(h2, file$3, 29, 8, 446);
    			add_location(i, file$3, 31, 54, 607);
    			add_location(p0, file$3, 31, 12, 565);
    			attr_dev(div0, "id", "disclaimer");
    			attr_dev(div0, "class", "sub-titles");
    			add_location(div0, file$3, 30, 8, 512);
    			add_location(b1, file$3, 34, 43, 792);
    			attr_dev(legend1, "class", "title-compress");
    			add_location(legend1, file$3, 34, 12, 761);
    			add_location(p1, file$3, 36, 12, 833);
    			attr_dev(fieldset0, "id", "content-fc");
    			attr_dev(fieldset0, "class", "sub-titles content");
    			add_location(fieldset0, file$3, 33, 8, 695);
    			add_location(br, file$3, 38, 12, 1235);
    			add_location(b2, file$3, 40, 20, 1329);
    			add_location(legend2, file$3, 40, 12, 1321);
    			add_location(p2, file$3, 41, 8, 1370);
    			attr_dev(fieldset1, "id", "content-history");
    			attr_dev(fieldset1, "class", "sub-titles content");
    			add_location(fieldset1, file$3, 39, 8, 1250);
    			attr_dev(fieldset2, "class", "content");
    			add_location(fieldset2, file$3, 27, 4, 373);
    			attr_dev(div1, "id", "about-con");
    			add_location(div1, file$3, 26, 0, 348);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, fieldset2);
    			append_dev(fieldset2, legend0);
    			append_dev(legend0, b0);
    			append_dev(fieldset2, t1);
    			append_dev(fieldset2, h2);
    			append_dev(fieldset2, t3);
    			append_dev(fieldset2, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(p0, i);
    			append_dev(p0, t6);
    			append_dev(fieldset2, t7);
    			append_dev(fieldset2, fieldset0);
    			append_dev(fieldset0, legend1);
    			append_dev(legend1, b1);
    			append_dev(fieldset0, t9);
    			append_dev(fieldset0, p1);
    			append_dev(fieldset2, t11);
    			append_dev(fieldset2, br);
    			append_dev(fieldset2, t12);
    			append_dev(fieldset2, fieldset1);
    			append_dev(fieldset1, legend2);
    			append_dev(legend2, b2);
    			append_dev(fieldset1, t14);
    			append_dev(fieldset1, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("fc-about", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<fc-about> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>.abt-title{text-align:center}.sub-titles{padding-top:4rem;text-align:center}.content{border:3px solid rgba(29, 217, 17, 0.76)}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("fc-about", About);

    /* src\MainContent.svelte generated by Svelte v3.37.0 */

    const file$2 = "src\\MainContent.svelte";

    function create_fragment$2(ctx) {
    	let div4;
    	let div3;
    	let h10;
    	let t1;
    	let h2;
    	let t3;
    	let fieldset;
    	let div0;
    	let h11;
    	let t5;
    	let h3;
    	let t7;
    	let h4;
    	let t9;
    	let p0;
    	let t11;
    	let hr0;
    	let t12;
    	let div1;
    	let p1;
    	let t13;
    	let i;
    	let t15;
    	let t16;
    	let p2;
    	let t18;
    	let hr1;
    	let t19;
    	let div2;
    	let p3;
    	let t21;
    	let betw1_08;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Welcome To";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "NitLyn";
    			t3 = space();
    			fieldset = element("fieldset");
    			div0 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Upload.";
    			t5 = space();
    			h3 = element("h3");
    			h3.textContent = "Compress.";
    			t7 = space();
    			h4 = element("h4");
    			h4.textContent = "SHARE!";
    			t9 = space();
    			p0 = element("p");
    			p0.textContent = "NitLyn, Because Free Is Better!";
    			t11 = space();
    			hr0 = element("hr");
    			t12 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t13 = text("NOTE: this version of NitLyn is a very ");
    			i = element("i");
    			i.textContent = "skinned down version";
    			t15 = text(" of NitLyn's FC (File Compressor)");
    			t16 = space();
    			p2 = element("p");
    			p2.textContent = "Meaning that the compressor may break or not work to it's full potential";
    			t18 = space();
    			hr1 = element("hr");
    			t19 = space();
    			div2 = element("div");
    			p3 = element("p");
    			p3.textContent = "You always hear company's saying that there trying to change the world, and for the most part they don't do anything. Here at NitLyn we're not going to say that we're trying to change the world or make it a better place. We're just here to change your file sizes.";
    			t21 = space();
    			betw1_08 = element("betw1-08");
    			this.c = noop;
    			add_location(h10, file$2, 22, 8, 348);
    			add_location(h2, file$2, 23, 8, 376);
    			add_location(h11, file$2, 27, 16, 548);
    			add_location(h3, file$2, 28, 16, 581);
    			add_location(h4, file$2, 29, 16, 616);
    			attr_dev(div0, "class", "qb-mat");
    			add_location(div0, file$2, 26, 12, 511);
    			add_location(p0, file$2, 31, 12, 667);
    			attr_dev(hr0, "class", "mainc-divider");
    			add_location(hr0, file$2, 32, 12, 718);
    			add_location(i, file$2, 35, 58, 928);
    			add_location(p1, file$2, 35, 16, 886);
    			add_location(p2, file$2, 36, 16, 1009);
    			attr_dev(div1, "id", "mainc-about");
    			attr_dev(div1, "class", "main-abt");
    			add_location(div1, file$2, 33, 12, 757);
    			add_location(hr1, file$2, 39, 12, 1173);
    			add_location(p3, file$2, 41, 16, 1247);
    			attr_dev(div2, "id", "mainc-about2");
    			attr_dev(div2, "class", "main-abt");
    			add_location(div2, file$2, 40, 12, 1190);
    			attr_dev(fieldset, "id", "content");
    			attr_dev(fieldset, "class", "mc-con");
    			add_location(fieldset, file$2, 24, 8, 400);
    			attr_dev(div3, "id", "greet");
    			add_location(div3, file$2, 21, 4, 323);
    			add_location(betw1_08, file$2, 46, 3, 1572);
    			attr_dev(div4, "id", "main-con-con");
    			add_location(div4, file$2, 20, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, h10);
    			append_dev(div3, t1);
    			append_dev(div3, h2);
    			append_dev(div3, t3);
    			append_dev(div3, fieldset);
    			append_dev(fieldset, div0);
    			append_dev(div0, h11);
    			append_dev(div0, t5);
    			append_dev(div0, h3);
    			append_dev(div0, t7);
    			append_dev(div0, h4);
    			append_dev(fieldset, t9);
    			append_dev(fieldset, p0);
    			append_dev(fieldset, t11);
    			append_dev(fieldset, hr0);
    			append_dev(fieldset, t12);
    			append_dev(fieldset, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t13);
    			append_dev(p1, i);
    			append_dev(p1, t15);
    			append_dev(div1, t16);
    			append_dev(div1, p2);
    			append_dev(fieldset, t18);
    			append_dev(fieldset, hr1);
    			append_dev(fieldset, t19);
    			append_dev(fieldset, div2);
    			append_dev(div2, p3);
    			append_dev(div4, t21);
    			append_dev(div4, betw1_08);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("main-content", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<main-content> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class MainContent extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>#greet{text-align:center}.mc-con{border:3px solid rgba(29, 217, 17, 0.76)}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("main-content", MainContent);

    /* src\content\Faq.svelte generated by Svelte v3.37.0 */

    const file$1 = "src\\content\\Faq.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let fieldset5;
    	let legend;
    	let b0;
    	let t1;
    	let fieldset0;
    	let h20;
    	let t3;
    	let p0;
    	let i0;
    	let t5;
    	let p1;
    	let b1;
    	let t7;
    	let fieldset1;
    	let h21;
    	let t9;
    	let p2;
    	let i1;
    	let t11;
    	let p3;
    	let b2;
    	let t13;
    	let fieldset2;
    	let h22;
    	let t15;
    	let p4;
    	let i2;
    	let t17;
    	let p5;
    	let b3;
    	let t19;
    	let fieldset3;
    	let h23;
    	let t21;
    	let p6;
    	let i3;
    	let t23;
    	let p7;
    	let b4;
    	let t25;
    	let fieldset4;
    	let h24;
    	let t27;
    	let p8;
    	let i4;
    	let t29;
    	let p9;
    	let b5;
    	let t31;
    	let div1;
    	let h3;
    	let t33;
    	let a;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			fieldset5 = element("fieldset");
    			legend = element("legend");
    			b0 = element("b");
    			b0.textContent = "NitLyn's FAQ";
    			t1 = space();
    			fieldset0 = element("fieldset");
    			h20 = element("h2");
    			h20.textContent = "What Is NitLyn?";
    			t3 = space();
    			p0 = element("p");
    			i0 = element("i");
    			i0.textContent = "Question: What Is NitLyn... I've hear about it, but i don't know what it is.";
    			t5 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "Answer: NitLyn is a lossless compression application that allows its user to compress files without changes in quality of pictures or videos using their lossless compression alogrithm.";
    			t7 = space();
    			fieldset1 = element("fieldset");
    			h21 = element("h2");
    			h21.textContent = "What type of compression do you use?";
    			t9 = space();
    			p2 = element("p");
    			i1 = element("i");
    			i1.textContent = "Question: There are many different types of compression, what compression does NitLyn use?";
    			t11 = space();
    			p3 = element("p");
    			b2 = element("b");
    			b2.textContent = "Answer: We use LZ77 lossless compression.";
    			t13 = space();
    			fieldset2 = element("fieldset");
    			h22 = element("h2");
    			h22.textContent = "Is NitLyn Free?";
    			t15 = space();
    			p4 = element("p");
    			i2 = element("i");
    			i2.textContent = "Question: Do I have to pay for NitLyn?";
    			t17 = space();
    			p5 = element("p");
    			b3 = element("b");
    			b3.textContent = "Answer: NitLyn is 100% free on all desktop devices";
    			t19 = space();
    			fieldset3 = element("fieldset");
    			h23 = element("h2");
    			h23.textContent = "Does NitLyn track me?";
    			t21 = space();
    			p6 = element("p");
    			i3 = element("i");
    			i3.textContent = "Question: I've heard that other services track me. Does NitLyn do the same?";
    			t23 = space();
    			p7 = element("p");
    			b4 = element("b");
    			b4.textContent = "Answer: No, NitLyn will not track any of your personal information, however NitLyn may ask you to link your Google, Github or any other service you may have.";
    			t25 = space();
    			fieldset4 = element("fieldset");
    			h24 = element("h2");
    			h24.textContent = "Will NitLyn ever be on mobile?";
    			t27 = space();
    			p8 = element("p");
    			i4 = element("i");
    			i4.textContent = "Question: I want to get NitLyn, but I only want it on my phone. Will a mobile version ever come out?";
    			t29 = space();
    			p9 = element("p");
    			b5 = element("b");
    			b5.textContent = "Answer: Although we are focusing on a desktop development at the moment, we will be working on a mobile version very soon, hopefully after we complete the desktop development.";
    			t31 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "For More Questions";
    			t33 = space();
    			a = element("a");
    			a.textContent = "Email Us Here!";
    			this.c = noop;
    			add_location(b0, file$1, 66, 16, 1033);
    			add_location(legend, file$1, 66, 8, 1025);
    			attr_dev(h20, "class", "faq-title");
    			add_location(h20, file$1, 69, 16, 1128);
    			add_location(i0, file$1, 70, 19, 1190);
    			add_location(p0, file$1, 70, 16, 1187);
    			add_location(b1, file$1, 71, 19, 1297);
    			add_location(p1, file$1, 71, 16, 1294);
    			attr_dev(fieldset0, "id", "sub1-faq");
    			attr_dev(fieldset0, "class", "faq-sub");
    			add_location(fieldset0, file$1, 68, 8, 1071);
    			attr_dev(h21, "class", "faq-title");
    			add_location(h21, file$1, 75, 12, 1575);
    			add_location(i1, file$1, 76, 15, 1655);
    			add_location(p2, file$1, 76, 12, 1652);
    			add_location(b2, file$1, 77, 16, 1774);
    			add_location(p3, file$1, 77, 13, 1771);
    			attr_dev(fieldset1, "id", "sub2-faq");
    			attr_dev(fieldset1, "class", "faq-sub");
    			add_location(fieldset1, file$1, 74, 8, 1522);
    			attr_dev(h22, "class", "faq-title");
    			add_location(h22, file$1, 81, 12, 1909);
    			add_location(i2, file$1, 82, 15, 1967);
    			add_location(p4, file$1, 82, 12, 1964);
    			add_location(b3, file$1, 83, 15, 2032);
    			add_location(p5, file$1, 83, 12, 2029);
    			attr_dev(fieldset2, "id", "sub3-faq");
    			attr_dev(fieldset2, "class", "faq-sub");
    			add_location(fieldset2, file$1, 80, 8, 1856);
    			attr_dev(h23, "class", "faq-title");
    			add_location(h23, file$1, 87, 12, 2176);
    			add_location(i3, file$1, 88, 15, 2240);
    			add_location(p6, file$1, 88, 12, 2237);
    			add_location(b4, file$1, 89, 15, 2342);
    			add_location(p7, file$1, 89, 12, 2339);
    			attr_dev(fieldset3, "id", "sub4-faq");
    			attr_dev(fieldset3, "class", "faq-sub");
    			add_location(fieldset3, file$1, 86, 8, 2123);
    			attr_dev(h24, "class", "faq-title");
    			add_location(h24, file$1, 93, 4, 2577);
    			add_location(i4, file$1, 94, 7, 2642);
    			add_location(p8, file$1, 94, 4, 2639);
    			add_location(b5, file$1, 95, 7, 2761);
    			add_location(p9, file$1, 95, 4, 2758);
    			attr_dev(fieldset4, "id", "sub5-faq");
    			attr_dev(fieldset4, "class", "faq-sub");
    			add_location(fieldset4, file$1, 92, 0, 2532);
    			attr_dev(fieldset5, "id", "faq-outer");
    			add_location(fieldset5, file$1, 65, 4, 991);
    			attr_dev(div0, "id", "faq-content");
    			add_location(div0, file$1, 64, 0, 964);
    			add_location(h3, file$1, 103, 4, 3103);
    			attr_dev(a, "href", "mailto:nitlynbusiness@gmail.com");
    			add_location(a, file$1, 104, 4, 3135);
    			attr_dev(div1, "id", "faq-py");
    			add_location(div1, file$1, 102, 0, 3081);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, fieldset5);
    			append_dev(fieldset5, legend);
    			append_dev(legend, b0);
    			append_dev(fieldset5, t1);
    			append_dev(fieldset5, fieldset0);
    			append_dev(fieldset0, h20);
    			append_dev(fieldset0, t3);
    			append_dev(fieldset0, p0);
    			append_dev(p0, i0);
    			append_dev(fieldset0, t5);
    			append_dev(fieldset0, p1);
    			append_dev(p1, b1);
    			append_dev(fieldset5, t7);
    			append_dev(fieldset5, fieldset1);
    			append_dev(fieldset1, h21);
    			append_dev(fieldset1, t9);
    			append_dev(fieldset1, p2);
    			append_dev(p2, i1);
    			append_dev(fieldset1, t11);
    			append_dev(fieldset1, p3);
    			append_dev(p3, b2);
    			append_dev(fieldset5, t13);
    			append_dev(fieldset5, fieldset2);
    			append_dev(fieldset2, h22);
    			append_dev(fieldset2, t15);
    			append_dev(fieldset2, p4);
    			append_dev(p4, i2);
    			append_dev(fieldset2, t17);
    			append_dev(fieldset2, p5);
    			append_dev(p5, b3);
    			append_dev(fieldset5, t19);
    			append_dev(fieldset5, fieldset3);
    			append_dev(fieldset3, h23);
    			append_dev(fieldset3, t21);
    			append_dev(fieldset3, p6);
    			append_dev(p6, i3);
    			append_dev(fieldset3, t23);
    			append_dev(fieldset3, p7);
    			append_dev(p7, b4);
    			append_dev(fieldset5, t25);
    			append_dev(fieldset5, fieldset4);
    			append_dev(fieldset4, h24);
    			append_dev(fieldset4, t27);
    			append_dev(fieldset4, p8);
    			append_dev(p8, i4);
    			append_dev(fieldset4, t29);
    			append_dev(fieldset4, p9);
    			append_dev(p9, b5);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t33);
    			append_dev(div1, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("faq-content", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<faq-content> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Faq extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>#faq-content{display:grid;gap:1.5rem;grid-template-columns:repeat(2, 1fr);grid-template-columns:repeat(2, minmax(20rem, 1fr));grid-template-columns:repeat(auto-fit, minmax(20rem, 1fr))}#faq-outer{border:3px solid rgba(29, 217, 17, 0.76)}.faq-sub{border:3px solid rgba(29, 217, 17, 0.76)}#faq-content{margin-top:2rem}#sub2-faq{margin-top:4rem}#sub3-faq{margin-top:4rem}#sub4-faq{margin-top:4rem}#sub5-faq{margin-top:4rem}.faq-title{text-align:center}#faq-py{margin-top:3rem;text-align:center}</style>`;

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("faq-content", Faq);

    /* src\content\ads\ad1.svelte generated by Svelte v3.37.0 */

    const file = "src\\content\\ads\\ad1.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			this.c = noop;
    			attr_dev(div0, "id", "be");
    			add_location(div0, file, 17, 4, 211);
    			attr_dev(div1, "id", "be-con");
    			add_location(div1, file, 16, 0, 189);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("betw1-08", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<betw1-08> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Ad1 extends SvelteElement {
    	constructor(options) {
    		super();

    		init(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{}
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("betw1-08", Ad1);

}());
//# sourceMappingURL=bundle.js.map
