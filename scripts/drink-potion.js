
const isPotion = (item) => /^potion of [\w]*\s?healing$/i.test(item.data.name);

// Takes the global speaker variable to identifies speakr in chat message
function drinkPotion(speaker) {
  // Check if exactly one actor is selected
  const actor = canvas.tokens.controlled[0]?.actor;
  if (
    actor === null ||
    actor === undefined ||
    canvas.tokens.controlled.leangth > 1
  ) {
    ui.notifications.error("Please select a single token");
    return;
  }

  // check if actor is at full life
  const health = actor?.data.data.attributes.hp;
  if (health.value >= health.max) {
    ui.notifications.error("Already at maximum health!");
    return;
  }

  // check if actor has any health potions
  const potions = actor.items.filter((item) => isPotion(item));
  if (potions === null || potions === undefined || potions.length < 1) {
    ui.notifications.error("No Health Potion found!");
    return;
  }
  // select health potion
  let usePotion = false;
  new Dialog({
    title: "Select potion to use",
    content: `
    <br>
    <form>
        <div class form-group>
            <label>Select potion: </label>
            <select id="potion-type" name="potion-type">
                ${potions.map((potion, index) => {
                  return `\t<option value=${index}>${potion.data.name}</option>`;
                })}
            </select>
        </div>
    </form>
    <br>
 `,
    buttons: {
      ok: {
        icon: "",
        label: "ok",
        callback: () => (usePotion = true),
      },
      abort: {
        icon: "",
        label: "cancel",
      },
    },
    default: "no",
    close: async (html) => {
        if (usePotion) {
          const potion = potions[html.find('[name="potion-type"]')[0].value];
          console.log(potion);
          // apply healing. if new health > max health then current health = max health
          const healing = new Roll(potion.data.data.damage.parts[0][0]).evaluate()
            .total;
          const newHealth = health.value + healing;
          await actor.update({
            "data.attributes.hp.value":
              newHealth > health.max ? health.max : newHealth,
          });
      
          // remove one potion of used type
          await potion.update({ "data.quantity": potion.data.data.quantity - 1 });
          if (potion.data.data.quantity < 1) {
            await potion.delete();
          }
      
          // create chat mesasge
          ChatMessage.create({
            user: game.user._id,
            content: `
                    <div class="dnd5e chat-card item-card">
                        <header class="card-header flexrow">
                            <img class="" src="${potion.data.img}" width="36" height="36"> 
                            <h3 class="item-name">${potion.data.name}</h3>
                        </header>
                        <div class="card-content" style="display: block;">
                            <p>${potion.data.data.description.value}</p>
                            <p>You regain ${healing} hitpoints</p>
                        </div>
                    </div>
                    `,
            speaker: speaker,
          });
        }
    }
  }).render(true);
};
