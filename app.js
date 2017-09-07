window.onload = function() {
  const data = {
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
  Vue.component('block', {
    props: ['index'],
    template: `<div class=block
      contenteditable
      draggable
      :inner-text=label
      @keydown.enter.prevent
      @blur=blur
      @input=edit
      @focus=editstart
      @dragstart=dragstart>{{label}}</div>`,
    computed: {
      label() {
        return data.blocks[this.index];
      }
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
      drop({target}) {
        const blockText = data.temp.dragtext;
        const blockIndex = data.blocks.indexOf(blockText);

        const dayText = target.textContent.trim();

        data.schedule[dayText] = data.schedule[dayText].concat(blockIndex);
        data.temp.dragtext = null;
      }
    }
  });
}
