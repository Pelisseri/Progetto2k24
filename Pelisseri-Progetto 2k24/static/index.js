"use strict"

window.onload=function() {
    let _cmbEta=$('#cmbEta').css("width", "200px").css("color", "grey")
    let _h2=$('#h2')
    let _valuePeso=$('#valuePeso')
    let _valueAltezza=$('#valueAltezza')
    let _divGPT=$('#divGPT')
    let _divEsercizi=$('#divEsercizi').hide()
    let sex, height, weight

    $('.center-container').css("animation", "popUp 0.5s ease")

    $('#login').on("click", function() {
        Swal.fire({
            title: 'Log In <br><br> <img src="img/login.jpg" class="loginImg">',
            html: `
                <input id="username" class="swal2-input" placeholder="Username">
                <input id="password" type="password" class="swal2-input" placeholder="Password">
                `,
            confirmButtonText: 'OK'
        });
    })

    sliderUpdate($('#sliderPeso'), _valuePeso, "kg")
    sliderUpdate($('#sliderAltezza'), _valueAltezza, "cm")

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
        /*let newPosition = percent + "%"
        val.css("margin-left", newPosition)*/
    }

    $('#accedi3').css("opacity", 0.5)

    _divGPT.children("textarea").on("keyup", function() {
        $('#accedi3').css("opacity", 1).on("click", function() {
            _divGPT.hide()
            _divEsercizi.show()
            getScheda()
        })
    })

    function getScheda() {
        let rq=inviaRichiesta("GET", `/api/getScheda/petto`)
		rq.then((response)=>{
            console.log(response.data)
            for(let exercise of response.data)
                appendCard(exercise)
        })
    }

    function appendCard(exercise) {
        // Creazione di una colonna con classe "col-md-4" all'interno dell'elemento con id "day1"
        let _col = $('<div>').addClass("col-md-4 mb-4").appendTo($('#day1')); // Aggiunta della classe "mb-4" per lo spazio tra le colonne
    
        // Creazione di un elemento div con classe "card" e aggiunta all'interno della colonna
        let _card = $('<div>').addClass("card").appendTo(_col);
    
        // Creazione di un'immagine con classe "card-img-top" e definizione del percorso della sorgente (src)
        $('<img>').prop("src", "img/mia.jpg").addClass("card-img-top").appendTo(_card);
    
        // Creazione di un elemento div con classe "card-body" e aggiunta all'interno della card
        let _body = $('<div>').addClass("card-body").appendTo(_card);
    
        // Creazione di un titolo h5 con testo "Titolo" e classe "card-title", e aggiunta all'interno del corpo della card
        $('<h5>').text(exercise.nome).addClass("card-title").appendTo(_body);
    
        // Creazione di un paragrafo con testo "Testo" e classe "card-text", e aggiunta all'interno del corpo della card
        let text=exercise.tutorial.substring(0, 40)
        $('<small>').text(text).addClass("card-text").appendTo(_body)
        $('<small>').css("color", "grey").text(" ...altro").on("click", function() {
            Swal.fire({
                title: exercise.nome,
                html: "<img src='img/"+exercise.img+"' style='width:200px;'> <br><br> <small>"
                        +exercise.tutorial+"</small>"
            })}
        ).appendTo(_body)
        $('<small>').html("<br>Serie: ").appendTo(_body)
    }
}