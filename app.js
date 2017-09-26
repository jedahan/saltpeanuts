window.onload = function() {
  const data = (() => {
    const hash = rison.decode_object(decodeURI(window.location.hash.substring(1)));
    if (hash.updated > 0) { return hash; }

    const local = rison.decode_object(localStorage.getItem('saltpeanuts') || '');
    if (local.updated > 0) { return local; }

    return {
      updated: new Date(),
      blocks: [ 'study japanese', 'email', 'mozilla/nsf', 'click me!', 'elusive index 4' ],
      schedule: {
        monday: [1, 0, 0, 4],
        tuesday: [4, 4, 4, 4],
        wednesday: [],
        thursday: [],
        friday: [],
      },
      temp: {
        dragtext: null, // text of the block being dragged
        edittext: null, // text of the block being edited
        offset: null,   // offset to fix contenteditable caret
      }
    };
  })();

  window.setInterval(function() {
    data.updated = new Date();
    const datastring = rison.encode_object(data);

    localStorage.setItem('saltpeanuts', datastring);
    window.location.hash = datastring;
  }, 2000 );

  Vue.component('block', {
    props: ['labelIndex', 'blockIndex', 'dayName'],
    template: `<div v-bind:class="{ block: true, current: isCurrent }"
      contenteditable
      draggable
      :inner-text=label
      @blur=blur
      @input=edit
      @focus=editstart
      @dragstart=dragstart>{{label}}</div>`,
    computed: {
      label() {
        return data.blocks[this.labelIndex];
      },
      dayIndex() {
        const days = Object.keys(data.schedule);
        return days.findIndex(day => day === this.dayName);
      },
      isCurrent() {
        const currentDay = data.updated.getDay() - 1;
        const currentBlock = data.updated.getHours() - 10;

        if (this.labelIndex) {
          return this.blockIndex === currentBlock &&
                 this.dayIndex === currentDay;
        }
      },
    },
    data() { return data },
    // horrid hack to move the cursor to the right place
    beforeUpdate() {
      const range = window.getSelection().getRangeAt(0);
      if (this.$el === range.startContainer.parentNode) {
        data.temp.offset = range.startOffset;
        this.$nextTick(function() {
          const range = window.getSelection().getRangeAt(0);
          range.setStart(this.$el.firstChild, data.temp.offset);
        });
      }
    },
    methods: {
      editstart({target}) {
        data.temp.edittext = target.textContent;
      },
      edit({target}) {
        this.editing = true;
        data.blocks = data.blocks.map(function(block) {
          if (block == data.temp.edittext) {
            return target.textContent;
          } else {
            return block;
          }
        });
        data.temp.edittext = target.textContent;
      },
      blur() {
        data.temp.edittext = null;
      },
      dragstart({target}) {
        data.temp.dragtext = target.textContent;
      },
    }
  });
  const app = new Vue({
    el: '#app',
    data: data,
    methods: {
      dblclick({target}) {
        const dayText = target.textContent.trim();
        data.schedule[dayText] = [];
      },
      drop({target, y}) {
        const blockText = data.temp.dragtext;
        const labelIndex = data.blocks.indexOf(blockText);
        const indexAfter = Array.from(target.children)
          .findIndex(element => element.offsetTop >= y);

        const dayText = target.firstChild.textContent.trim();
        const schedule = data.schedule[dayText];
        const before = schedule.slice(0, indexAfter - 1);
        const after = schedule.slice(indexAfter - 1);
        const sched = before.concat([labelIndex]).concat(after);

        data.schedule[dayText] = sched;
        data.temp.dragtext = null;
      }
    },
  });
}
