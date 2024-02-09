"use strict"

window.onload=function() {
    let _cmbEta=$('#cmbEta').css("width", "200px").css("color", "grey")
    let _h2=$('#h2')
    let _valuePeso=$('#valuePeso')
    let _valueAltezza=$('#valueAltezza')
    let sex, height, weight

    $('.center-container').css("animation", "popUp 0.5s ease")

    sliderUpdate($('#sliderPeso'), _valuePeso, "kg")
    sliderUpdate($('#sliderAltezza'), _valueAltezza, "cm")

    _cmbEta.prop("selectedIndex", "-1")
    for(let i=18; i<61; i++)
        $('<option>').text(i).appendTo(_cmbEta)
    let getNome=localStorage.getItem("localName")
   _h2.prop("innerHTML", _h2.prop("innerHTML")+getNome)
   //console.log($('#sliderPeso').css("left"))

    _cmbEta.on("click", function() {
        _cmbEta.css("color", "")
    })
 
    $('#accedi').on("click", function() {
        let nome=$('#nome').val()
        let eta=_cmbEta.val()
        console.log(nome, eta)
        if(nome!="" && eta!="Età")
        {
            window.location.href="pagina2.html"
            localStorage.setItem("localName", nome)
            localStorage.setItem("localAge", eta)
        }
        else if(nome=="")
        {
            $('#nome').addClass("error")
            $('#nome').prop("placeholder", "Inserisci nome")
        }
        else
        {
            _cmbEta.addClass("error")
            //$('#nome').prop("placeholder", "Inserisci nome")
        }
    })

    $('#accedi2').on("click", function() {
        if(sex=="male" || sex=="female")
        {
            weight=_valuePeso.text()
            height=_valueAltezza.text()
            console.log(weight, height, sex)
            localStorage.setItem("localWeight", weight)
            localStorage.setItem("localHeight", height)
            localStorage.setItem("localSex", sex)
            window.location.href="pagina3.html"
        }
        else Swal.fire({
            title: 'Seleziona un genere',
            icon: 'error',
            confirmButtonText: 'OK'
          });
    })

    $('#sliderPeso').on("input", function() {
        sliderUpdate($(this), _valuePeso, "kg")
    })
    $('#sliderAltezza').on("input", function() {
        sliderUpdate($(this), _valueAltezza, "cm")
    })

    $('.icon').on("click", function() {
        $('.icon').css("background-color", "")
        $(this).css("background-color", "red")
        $(this).css("border-radius", "60px")
        sex=$(this).prop("id")
        console.log(sex)
    })

    function sliderUpdate(slider, val, unit) {
        val.prop("innerHTML", slider.val()+" "+unit)
        let percent = (slider.val() - slider.attr("min")) / (slider.attr("max") - slider.attr("min")) * 100
        let newPosition = percent + "%"
        val.css("margin-left", newPosition)
    }
}