// modified from http://html5demos.com/file-api

window.addEvent('domready', function() {
    var holder = document.getElementById('holder'),
        state = document.getElementById('status');

    var map = document.getElementById('map');
    var mapLoaded = false;

    if (typeof window.FileReader === 'undefined') {
        state.className = 'fail';
    } else {
        state.className = 'success';
        state.innerHTML = 'Drag and drop map!';
    }

    holder.ondragover = function () {
        this.className = 'hover';
        return false;
    };
    holder.ondragend = function () {
        this.className = '';
        return false;
    };
    holder.ondrop = function (e) {
        this.className = '';
        e.preventDefault();

        var file = e.dataTransfer.files[0],
            reader = new FileReader();
        reader.onload = function (event) {

            if (mapLoaded == false) { //load map
                svgfile = event.target.result;
                tempWidth = $(svgfile)[6].width.baseVal.value;
                tempHeight = $(svgfile)[6].height.baseVal.value;
                display_map(file.name, tempWidth, tempHeight);
                mapLoaded = true;
                state.innerHTML = 'And now your heatmap!';
            }
            else { //load heatmap
                //state.innerHTML = 'Already loaded a map!';
                csvfile = event.target.result;
                display_heatmap($.csv.toArrays(csvfile));
            }

        };
        reader.readAsText(file);

        return false;
    };
});
