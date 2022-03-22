const isRation = (item) => /^rations, .*$/i.test(item.data.name);

function eatRation(speaker) {
  const actor = canvas.tokens.controlled[0]?.actor;
  if (
    actor === null ||
    actor === undefined ||
    canvas.tokens.controlled.length > 1
  ) {
    ui.notifications.error("Please select a single token");
    return;
  }

  // check if actor has any rations
  const rations = actor.items.filter((item) => isRation(item));
  if (rations === null || rations === undefined || rations.length < 1) {
    ui.notifications.error("No Rations found!");
    return;
  }

  // select ration
  let useRation = false;
  new Dialog({
    title: "Select potion to use",
    content: `
    <br>
    <form>
        <div class form-group>
            <label>Select Ration: </label>
            <select id="ration-type" name="ration-type">
                ${rations.map((ration, index) => {
                  return `\t<option value=${index}>${ration.data.name}</option>`;
                })}
            </select>
        </div>
    </form>
    <br>
 `,
    buttons: {
      ok: {
        icon: "",
        label: "Ok",
        callback: () => (useRation = true),
      },
      abort: {
        icon: "",
        label: "Cancel",
      },
    },
    default: "abort",
    close: async (html) => {
      if (useRation) {
        const ration = rations[html.find('[name="ration-type"]')[0].value];
        console.log(ration);

        // remove one ration of used type
        await ration.update({ "data.quantity": ration.data.data.quantity - 1 });
        if (ration.data.data.quantity < 1) {
          await ration.delete();
        }

        // create chat mesasge
        ChatMessage.create({
          user: game.user._id,
          content: `
                    <div class="dnd5e chat-card item-card">
                        <header class="card-header flexrow">
                            <img class="" src="${ration.data.img}" width="36" height="36"> 
                            <h3 class="item-name">${ration.data.name}</h3>
                        </header>
                        <div class="card-content" style="display: block;">
                            <p>${ration.data.data.description.value}</p>
                        </div>
                    </div>
                    `,
          speaker: speaker,
        });
      }
    },
  }).render(true);
}
