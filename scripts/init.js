
/**
 * Activate certain behaviors on FVTT ready hook
 */
Hooks.once("init", () => {

  /**
   * Register diagonal movement rule setting
   */
  game.settings.register("pathfinder", "diagonalMovement", {
    name: "SETTINGS.5eDiagN",
    hint: "SETTINGS.5eDiagL",
    scope: "world",
    config: true,
    default: "555",
    type: String,
    choices: {
      "555": "SETTINGS.5eDiagPHB",
      "5105": "SETTINGS.5eDiagDMG"
    },
    onChange: rule => canvas.grid.diagonalRule = rule
  });

  /**
   * Register Initiative formula setting
   */
  function _set5eInitiative(tiebreaker) {
    CONFIG.initiative.tiebreaker = tiebreaker;
    CONFIG.initiative.decimals = tiebreaker ? 2 : 0;
    if ( ui.combat && ui.combat._rendered ) ui.combat.render();
  }
  game.settings.register("pathfinder", "initiativeDexTiebreaker", {
    name: "SETTINGS.5eInitTBN",
    hint: "SETTINGS.5eInitTBL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: enable => _set5eInitiative(enable)
  });
  _set5eInitiative(game.settings.get("pathfinder", "initiativeDexTiebreaker"));

  /**
   * Require Currency Carrying Weight
   */
  game.settings.register("pathfinder", "currencyWeight", {
    name: "SETTINGS.5eCurWtN",
    hint: "SETTINGS.5eCurWtL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  // Pre-load templates
  loadTemplates([

    // Actor Sheet Partials
    "public/systems/pathfinder-master/templates/actors/actor-attributes.html",
    "public/systems/pathfinder-master/templates/actors/actor-abilities.html",
    "public/systems/pathfinder-master/templates/actors/actor-biography.html",
    "public/systems/pathfinder-master/templates/actors/actor-skills.html",
    "public/systems/pathfinder-master/templates/actors/actor-traits.html",
    "public/systems/pathfinder-master/templates/actors/actor-classes.html",

    // Item Sheet Partials
    "public/systems/pathfinder-master/templates/items/backpack-sidebar.html",
    "public/systems/pathfinder-master/templates/items/class-sidebar.html",
    "public/systems/pathfinder-master/templates/items/consumable-details.html",
    "public/systems/pathfinder-master/templates/items/consumable-sidebar.html",
    "public/systems/pathfinder-master/templates/items/equipment-details.html",
    "public/systems/pathfinder-master/templates/items/equipment-sidebar.html",
    "public/systems/pathfinder-master/templates/items/feat-details.html",
    "public/systems/pathfinder-master/templates/items/feat-sidebar.html",
    "public/systems/pathfinder-master/templates/items/spell-details.html",
    "public/systems/pathfinder-master/templates/items/spell-sidebar.html",
    "public/systems/pathfinder-master/templates/items/tool-sidebar.html",
    "public/systems/pathfinder-master/templates/items/weapon-details.html",
    "public/systems/pathfinder-master/templates/items/weapon-sidebar.html"
  ]);

  /* -------------------------------------------- */

  /**
   * Override the default Initiative formula to customize special behaviors of the D&D5e system.
   * Apply advantage, proficiency, or bonuses where appropriate
   * Apply the dexterity score as a decimal tiebreaker if requested
   * See Combat._getInitiativeFormula for more detail.
   * @private
   */
  Combat.prototype._getInitiativeFormula = function(combatant) {
    const actor = combatant.actor;
    if ( !actor ) return "1d20";
    const data = actor ? actor.data.data : {},
          parts = ["1d20", data.attributes.init.mod];

    // Advantage on Initiative
    if ( actor.getFlag("pathfinder", "initiativeAdv") ) parts[0] = "2d20kh";

    // Half-Proficiency to Initiative
    if ( actor.getFlag("pathfinder", "initiativeHalfProf") ) {
      parts.push(Math.floor(0.5 * data.attributes.prof.value))
    }

    // Alert Bonus to Initiative
    if ( actor.getFlag("pathfinder", "initiativeAlert") ) parts.push(5);

    // Dexterity tiebreaker
    if ( CONFIG.initiative.tiebreaker ) parts.push(data.abilities.dex.value / 100);
    return parts.join("+");
  }
});


/**
 * Activate certain behaviors on Canvas Initialization hook
 */
Hooks.on("canvasInit", () => {

  // Apply the current setting
  canvas.grid.diagonalRule = game.settings.get("pathfinder", "diagonalMovement");

  /* -------------------------------------------- */

  /**
   * Override default Grid measurement
   */
  SquareGrid.prototype.measureDistance = function(p0, p1) {
    let gs = canvas.dimensions.size,
        ray = new Ray(p0, p1),
        nx = Math.abs(Math.ceil(ray.dx / gs)),
        ny = Math.abs(Math.ceil(ray.dy / gs));

    // Get the number of straight and diagonal moves
    let nDiagonal = Math.min(nx, ny),
        nStraight = Math.abs(ny - nx);

    // Alternative DMG Movement
    if ( this.parent.diagonalRule === "5105" ) {
      let nd10 = Math.floor(nDiagonal / 2);
      let spaces = (nd10 * 2) + (nDiagonal - nd10) + nStraight;
      return spaces * canvas.dimensions.distance;
    }

    // Standard PHB Movement
    else return (nStraight + nDiagonal) * canvas.scene.data.gridDistance;
  }
});
