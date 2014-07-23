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
        var minHeatValue = document.getElementById("minHeatValue").value;
        var maxHeatValue = document.getElementById("maxHeatValue").value;
        var intensityScalar = document.getElementById("scalar").value;

        var file = e.dataTransfer.files[0],
            reader = new FileReader();
        reader.onload = function (event) {

            if (mapLoaded == false) { //load map
                svgfile = event.target.result;
                tempWidth = $(svgfile)[6].viewBox.baseVal.width;
                tempHeight = $(svgfile)[6].viewBox.baseVal.height;
                map.style.width = tempWidth;
                map.style.height = tempHeight;
                display_map(file.name, tempWidth, tempHeight);
                add_heatmap();
                mapLoaded = true;
                state.innerHTML = 'And now your heatmap!';
            }
            else { //load heatmap
                csvfile = event.target.result;
                csvArray = $.csv.toArrays(csvfile);
                populate_heatmap(csvArray, csvArray.length, intensityScalar, minHeatValue, maxHeatValue);
            }

        };
        reader.readAsText(file);

        return false;
    };
});
