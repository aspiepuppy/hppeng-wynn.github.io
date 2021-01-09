/*
 * TESTING SECTION
 */

const url_base = location.href.split("#")[0];
const url_tag = location.hash.slice(1);
console.log(url_base);
console.log(url_tag);

/*
 * END testing section
 */

const BUILD_VERSION = "1.4";

document.getElementById("header").textContent = "Wynn build calculator "+BUILD_VERSION+" (db version "+DB_VERSION+")";

let player_build;
// Set up item lists for quick access later.
let armorTypes = [ "helmet", "chestplate", "leggings", "boots" ];
let accessoryTypes = [ "ring", "bracelet", "necklace" ];
let weaponTypes = [ "wand", "spear", "bow", "dagger", "relik" ];
// THIS IS SUPER DANGEROUS, WE SHOULD NOT BE KEEPING THIS IN SO MANY PLACES
let item_fields = [ "name", "displayName", "tier", "set", "slots", "type", "material", "drop", "quest", "restrict", "nDam", "fDam", "wDam", "aDam", "tDam", "eDam", "atkSpd", "hp", "fDef", "wDef", "aDef", "tDef", "eDef", "lvl", "classReq", "strReq", "dexReq", "intReq", "defReq", "agiReq", "hprPct", "mr", "sdPct", "mdPct", "ls", "ms", "xpb", "lb", "ref", "str", "dex", "int", "agi", "def", "thorns", "exploding", "spd", "atkTier", "poison", "hpBonus", "spRegen", "eSteal", "hprRaw", "sdRaw", "mdRaw", "fDamPct", "wDamPct", "aDamPct", "tDamPct", "eDamPct", "fDefPct", "wDefPct", "aDefPct", "tDefPct", "eDefPct", "fixID", "category", "spPct1", "spRaw1", "spPct2", "spRaw2", "spPct3", "spRaw3", "spPct4", "spRaw4", "rainbowRaw", "sprint", "sprintReg", "jh", "lq", "gXp", "gSpd", "id" ];
let skpReqs = ["strReq", "dexReq", "intReq", "defReq", "agiReq"];

let equipment_fields = [
    "helmet",
    "chestplate",
    "leggings",
    "boots",
    "ring1",
    "ring2",
    "bracelet",
    "necklace",
    "weapon"
];
let equipment_names = [
    "Helmet",
    "Chestplate",
    "Leggings",
    "Boots",
    "Ring 1",
    "Ring 2",
    "Bracelet",
    "Necklace",
    "Weapon"
];
let equipmentInputs = equipment_fields.map(x => x + "-choice");
let buildFields = equipment_fields.map(x => "build-"+x);

let powderIDs = new Map();
let powderNames = new Map();
let _powderID = 0;
for (const x of ['e', 't', 'w', 'f', 'a']) {
    for (let i = 1; i <= 6; ++i) {
        // Support both upper and lowercase, I guess.
        powderIDs.set(x.toUpperCase()+i, _powderID);
        powderIDs.set(x+i, _powderID);
        powderNames.set(_powderID, x+i);
        _powderID++;
    }
}
let powderInputs = [
    "helmet-powder",
    "chestplate-powder",
    "leggings-powder",
    "boots-powder",
    "weapon-powder",
];
// Ordering: [dmgMin, dmgMax, convert, defPlus, defMinus (+6 mod 5)]
class Powder {
    constructor(min, max, convert, defPlus, defMinus) {
        this.min = min;
        this.max = max;
        this.convert = convert;
        this.defPlus = defPlus;
        this.defMinus = defMinus;
    }
}
function _p(a,b,c,d,e) { return new Powder(a,b,c,d,e); }

let powderStats = [
    _p(3,6,17,2,1), _p(6,9,21,4,2), _p(8,14,25,8,3), _p(11,16,31,14,5), _p(15,18,38,22,9), _p(18,22,46,30,13),
    _p(1,8,9,3,1), _p(1,13,11,5,1), _p(2,18,14,9,2), _p(3,24,17,14,4), _p(3,32,22,20,7), _p(5,40,28,28,10),
    _p(3,4,13,3,1), _p(4,7,15,6,1), _p(6,10,17,11,2), _p(8,12,21,18,4), _p(11,14,26,28,7), _p(13,17,32,40,10),
    _p(2,5,14,3,1), _p(4,8,16,5,2), _p(6,10,19,9,3), _p(9,13,24,16,5), _p(12,16,30,25,9), _p(15,19,37,36,13),
    _p(2,6,11,3,1), _p(4,9,14,6,2), _p(7,10,17,10,3), _p(9,13,22,16,5), _p(13,18,28,24,9), _p(16,18,35,34,13)
];

let itemTypes = armorTypes.concat(accessoryTypes).concat(weaponTypes);
let itemLists = new Map();
for (const it of itemTypes) {
    itemLists.set(it, []);
}
let itemMap = new Map();
let idMap = new Map();

/*
 * Function that takes an item list and populates its corresponding dropdown.
 * Used for armors and bracelet/necklace.
 */
function populateItemList(type) {
    let item_list = document.getElementById(type+"-items");
    for (const item of itemLists.get(type)) {
        let el = document.createElement("option");
        el.value = item;
        item_list.appendChild(el);
    }
}

/*
 * Populate dropdowns, add listeners, etc.
 */
function init() {
    let noneItems = [
        ["armor", "helmet", "No Helmet"],
        ["armor", "chestplate", "No Chestplate"],
        ["armor", "leggings", "No Leggings"],
        ["armor", "boots", "No Boots"],
        ["accessory", "ring", "No Ring 1"],
        ["accessory", "ring", "No Ring 2"],
        ["accessory", "bracelet", "No Bracelet"],
        ["accessory", "necklace", "No Necklace"],
        ["weapon", "wand", "No Weapon"],
    ];
    for (let i = 0; i < 9; i++) {
        let item = Object();
        for (const field of item_fields) {
            item[field] = 0;
        }
        item.category = noneItems[i][0];
        item.type = noneItems[i][1];
        item.name = noneItems[i][2];
        item.displayName = item.name;
        item.set = null;
        item.quest = null;
        item.skillpoints = [0, 0, 0, 0, 0];
        item.has_negstat = false;
        item.reqs = [0, 0, 0, 0, 0];
        item.fixID = true;
        item.tier = " ";//do not get rid of this @hpp
        item.id = 10000 + i;
        item.nDam = "0-0";
        item.eDam = "0-0";
        item.tDam = "0-0";
        item.wDam = "0-0";
        item.fDam = "0-0";
        item.aDam = "0-0";

        noneItems[i] = item;
    }
    items = items.concat(noneItems);
    console.log(items);
    for (const item of items) {
        itemLists.get(item.type).push(item.displayName);
        itemMap.set(item.displayName, item);
        idMap.set(item.id, item.displayName);
    }
    
    for (const armorType of armorTypes) {
        populateItemList(armorType);
        // Add change listener to update armor slots.
        document.getElementById(armorType+"-choice").addEventListener("change", (event) => {
            let item = itemMap.get(event.target.value);
            if (item !== undefined) {
                document.getElementById(armorType+"-slots").textContent = item.slots + " slots";
            }
            else {
                document.getElementById(armorType+"-slots").textContent = "X slots";
            }
        });
    }

    let ring1_list = document.getElementById("ring1-items");
    let ring2_list = document.getElementById("ring2-items");
    for (const ring of itemLists.get("ring")) {
        let el1 = document.createElement("option");
        let el2 = document.createElement("option");
        el1.value = ring;
        el2.value = ring;
        ring1_list.appendChild(el1);
        ring2_list.appendChild(el2);
    }

    populateItemList("bracelet");
    populateItemList("necklace");

    let weapon_list = document.getElementById("weapon-items");
    for (const weaponType of weaponTypes) {
        for (const weapon of itemLists.get(weaponType)) {
            let el = document.createElement("option");
            el.value = weapon;
            weapon_list.appendChild(el);
        }
    }

    // Add change listener to update weapon slots.
    document.getElementById("weapon-choice").addEventListener("change", (event) => {
        let item = itemMap.get(event.target.value);
        if (item !== undefined) {
            document.getElementById("weapon-slots").textContent = item.slots + " slots";
        }
        else {
            document.getElementById("weapon-slots").textContent = "X slots";
        }
    });

    populateFromURL();
}

/*
 * Populate fields based on url, and calculate build.
 */
function populateFromURL() {
    if (url_tag) {
        let equipment = [null, null, null, null, null, null, null, null, null];
        let powdering = ["", "", "", "", ""];
        let info = url_tag.split("_");
        let version = info[0];
        if (version === "0" || version === "1") {
            let equipments = info[1];
            for (let i = 0; i < 9; ++i ) {
                equipment[i] = idMap.get(Base64.toInt(equipments.slice(i*3,i*3+3)));
            }
        }
        if (version === "1") {
            let powder_info = info[1].slice(27);
            console.log(powder_info);
            // TODO: Make this run in linear instead of quadratic time...
            for (let i = 0; i < 5; ++i) {
                let powders = "";
                let n_blocks = Base64.toInt(powder_info.charAt(0));
                console.log(n_blocks + " blocks");
                powder_info = powder_info.slice(1);
                for (let j = 0; j < n_blocks; ++j) {
                    let block = powder_info.slice(0,5);
                    console.log(block);
                    let six_powders = Base64.toInt(block);
                    for (let k = 0; k < 6 && six_powders != 0; ++k) {
                        powders += powderNames.get((six_powders & 0x1f) - 1);
                        six_powders >>>= 5;
                    }
                    powder_info = powder_info.slice(5);
                }
                powdering[i] = powders;
            }
        }

        for (let i in powderInputs) {
            setValue(powderInputs[i], powdering[i]);
        }
        for (let i in equipment) {
            setValue(equipmentInputs[i], equipment[i]);
        }
        setValue("str-skp", "0");
        setValue("dex-skp", "0");
        setValue("int-skp", "0");
        setValue("def-skp", "0");
        setValue("agi-skp", "0");
        calculateBuild();
    }
}

function encodeBuild() {
    if (player_build) {
//        let build_string = "0_" + Base64.fromIntN(player_build.helmet.id, 3) +
//                            Base64.fromIntN(player_build.chestplate.id, 3) +
//                            Base64.fromIntN(player_build.leggings.id, 3) +
//                            Base64.fromIntN(player_build.boots.id, 3) +
//                            Base64.fromIntN(player_build.ring1.id, 3) +
//                            Base64.fromIntN(player_build.ring2.id, 3) +
//                            Base64.fromIntN(player_build.bracelet.id, 3) +
//                            Base64.fromIntN(player_build.necklace.id, 3) +
//                            Base64.fromIntN(player_build.weapon.id, 3);
        let build_string = "1_" + Base64.fromIntN(player_build.helmet.get("id"), 3) +
                            Base64.fromIntN(player_build.chestplate.get("id"), 3) +
                            Base64.fromIntN(player_build.leggings.get("id"), 3) +
                            Base64.fromIntN(player_build.boots.get("id"), 3) +
                            Base64.fromIntN(player_build.ring1.get("id"), 3) +
                            Base64.fromIntN(player_build.ring2.get("id"), 3) +
                            Base64.fromIntN(player_build.bracelet.get("id"), 3) +
                            Base64.fromIntN(player_build.necklace.get("id"), 3) +
                            Base64.fromIntN(player_build.weapon.get("id"), 3);

        for (const _powderset of player_build.powders) {
            let n_bits = Math.ceil(_powderset.length / 6);
            build_string += Base64.fromIntN(n_bits, 1); // Hard cap of 378 powders.
            // Slice copy.
            let powderset = _powderset.slice();
            while (powderset.length != 0) {
                let firstSix = powderset.slice(0,6).reverse();
                let powder_hash = 0;
                for (const powder of firstSix) {
                    powder_hash = (powder_hash << 5) + 1 + powder; // LSB will be extracted first.
                }
                build_string += Base64.fromIntN(powder_hash, 5);
                powderset = powderset.slice(6);
            }
        }

        return build_string;
    }
    return "";
}

function calculateBuild(){
    /*  TODO: implement level changing
        Make this entire function prettier
    */
    let equipment = [ null, null, null, null, null, null, null, null, null ];
    for (let i in equipment) {
        let equip = getValue(equipmentInputs[i]);
        if (equip === "") equip = "No " + equipment_names[i];
        equipment[i] = equip;
    }
    let powderings = [];
    for (const i in powderInputs) {
        // read in two characters at a time.
        // TODO: make this more robust.
        let input = getValue(powderInputs[i]);
        let powdering = [];
        while (input) {
            let first = input.slice(0, 2);
            powdering.push(powderIDs.get(first));
            input = input.slice(2);
        }
        powderings.push(powdering);
    }
    console.log(equipment);
    player_build = new Build(106, equipment, powderings);
    console.log(player_build.toString());

    let equip_order_text = "Equip order: <br>";
    for (const item of player_build.equip_order) {
        equip_order_text += item.get("displayName") + "<br>";
    }
    setHTML("build-order", equip_order_text);
    
    const assigned = player_build.base_skillpoints;
    const skillpoints = player_build.total_skillpoints;

    let skp_order = ["str","dex","int","def","agi"];
    let skp_effects = ["% more damage dealt.","% chance to crit.","% spell cost reduction.","% less damage taken.","% chance to dodge."];
    for (let i in skp_order){ //big bren
        setText(skp_order[i] + "-skp-assign", "Before Boosts: " + assigned[i]);
        setValue(skp_order[i] + "-skp", skillpoints[i]);
        if(assigned[i] <= 100){
            setText(skp_order[i] + "-skp-base", "Original Value: " + skillpoints[i]);
        }else{
            setHTML(skp_order[i] + "-skp-base", "Original Value: " + skillpoints[i] + "<br>WARNING: cannot assign " + assigned[i] + " skillpoints naturally.");
        }
        setText(skp_order[i] + "-skp-pct", (skillPointsToPercentage(skillpoints[i])*100).toFixed(1).concat(skp_effects[i]));
    }
    if(player_build.assigned_skillpoints > levelToSkillPoints(player_build.level)){
        setHTML("summary-box", "Summary: Assigned "+player_build.assigned_skillpoints+" skillpoints.<br>" + "WARNING: Too many skillpoints need to be assigned!<br> For level " + player_build.level + ", there are only " + levelToSkillPoints(player_build.level) + " skill points available.");
    }else{
        setText("summary-box", "Summary: Assigned "+player_build.assigned_skillpoints+" skillpoints.");
    }

    for (let i in player_build.items) {
        displayExpandedItem(player_build.items[i], buildFields[i]);
    }
    calculateBuildStats();
}

function calculateBuildStats() {
    let meleeStats = player_build.getMeleeStats();
    //nDamAdj,eDamAdj,tDamAdj,wDamAdj,fDamAdj,aDamAdj,totalDamNorm,totalDamCrit,normDPS,critDPS,avgDPS
    for (let i = 0; i < 6; ++i) {
        for (let j in meleeStats[i]) {
            meleeStats[i][j] = Math.round(meleeStats[i][j]);
        }
    }
    for (let i = 6; i < 8; ++i) {
        for (let j in meleeStats[i]) {
            meleeStats[i][j] = Math.round(meleeStats[i][j]);
        }
    }
    let meleeSummary = "";
    meleeSummary = meleeSummary.concat("<h1><u>Melee Stats</u></h1>");
    meleeSummary = meleeSummary.concat("<h2>Average DPS: ",Math.round(meleeStats[10]),"</h2> <br>");
    let attackSpeeds = ["SUPER SLOW", "VERY SLOW", "SLOW", "NORMAL", "FAST", "VERY FAST", "SUPER FAST"];
    meleeSummary = meleeSummary.concat("<b>Attack Speed: ",attackSpeeds[meleeStats[11]],"</b><br><br>");
    meleeSummary = meleeSummary.concat("<b>Non-Crit Stats: </b><br>");
    let damagePrefixes = ["Neutral Damage: ","Earth Damage: ","Thunder Damage: ","Water Damage: ","Fire Damage: ","Air Damage: "];
    for (let i = 0; i < 6; i++){
        if(meleeStats[i][0] > 0){
            meleeSummary = meleeSummary.concat(damagePrefixes[i],meleeStats[i][0]," -> ",meleeStats[i][1],"<br>");
        }
    }
    meleeSummary = meleeSummary.concat("<br>Total Damage: ",meleeStats[6][0]," -> ",meleeStats[6][1],"<br>");
    meleeSummary = meleeSummary.concat("Normal DPS: ",Math.round(meleeStats[8]),"<br><br>");
    meleeSummary = meleeSummary.concat("<b>Crit Stats: </b><br>");
    for (let i = 0; i < 6; i++){
        if(meleeStats[i][2] > 0){
            meleeSummary = meleeSummary.concat(damagePrefixes[i],meleeStats[i][2]," -> ",meleeStats[i][3],"<br>");
        }
    }
    meleeSummary = meleeSummary.concat("<br>Total Damage: ",meleeStats[7][0]," -> ",meleeStats[7][1],"<br>");
    meleeSummary = meleeSummary.concat("Crit DPS: ",Math.round(meleeStats[9]),"<br><br>");
    setHTML("build-melee-stats", "".concat(meleeSummary)); //basically complete function
    let defenseStats = "";

    setHTML("build-defense-stats", "".concat(defenseStats));
    location.hash = encodeBuild();
}

function resetFields(){
    for (let i in powderInputs) {
        setValue(powderInputs[i], "");
    }
    for (let i in equipment) {
        setValue(equipmentInputs[i], "");
    }
    setValue("str-skp", "0");
    setValue("dex-skp", "0");
    setValue("int-skp", "0");
    setValue("def-skp", "0");
    setValue("agi-skp", "0");
    location.hash = "";
}

load_init(init);

