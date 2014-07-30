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
        var interval = 5000; //time between next heatmap in ms.
        this.className = '';
        e.preventDefault();

        var canvas;
        var heat_div = document.createElement('div');
        heat_div.id = "heat-title";
        var heat_title;

        var reader = new FileReader();
        var files = e.dataTransfer.files;
        if(files.length == 1){
            var file = files[0];
            reader.readAsText(file);
            reader.onload = function (event) {
                svgfile = event.target.result;

                tempWidth = $(svgfile)[6].viewBox.baseVal.width;
                tempHeight = $(svgfile)[6].viewBox.baseVal.height;
                map.style.width = tempWidth;
                map.style.height = tempHeight;

                display_map(file.name, tempWidth, tempHeight);

                add_heatmap();

                canvas = document.getElementsByTagName("canvas")[0];
                canvas.parentNode.appendChild(heat_div);

                mapLoaded = true;
                state.innerHTML = 'And now your heatmaps!';
            };
        }
        else
        {
            var i = 0;
            var intervalHandle = setInterval(function() {
                processCSV();
                i = i + 1;
                if(files.length == i){
                    clearInterval(intervalHandle);
                }
            }, interval);

            function processCSV(){
                var file = files[i];
                reader.readAsText(file);
                reader.onload = function (event) {
                    var csvfile = event.target.result;
                    csvArray = $.csv.toArrays(csvfile);
                    heat_title = document.getElementById("heat-title");
                    heat_title.innerHTML = file.name.split(".")[0];
                    populate_heatmap(csvArray, 0.05, 1.0);
                };
            }
        }

        return false;
    };
});
