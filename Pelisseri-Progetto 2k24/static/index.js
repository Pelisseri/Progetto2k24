"use strict"

window.onload=function() {
    let _cmbEta=$('#cmbEta').css("width", "200px").css("color", "grey")
    let _h2=$('#h2')
    let _h4=$('#h4')
    let _valuePeso=$('#valuePeso')
    let _valueAltezza=$('#valueAltezza')
    let _divGPT=$('#divGPT')
    let _allenamento=$('#allenamento')
    let _divEsercizi=$('#divEsercizi').hide()
    let _divDieta=$('#divDieta').hide()
    let _menu=$('#menu').hide()
    let _dietTable=$('#dietTable')
    let name, age, sex, height, weight, goal
    let isUser=false

    $('.center-container').css("animation", "popUp 0.5s ease")

    $('#login').on("click", function() {
        Swal.fire({
            title: 'Log In <br><br> <img src="img/login.jpg" class="loginImg">',
            html: `
                <input id="username" class="swal2-input" placeholder="Username">
                <input id="password" type="password" class="swal2-input" placeholder="Password">
                <p id="lblErrore" style="display: none; color: red;"></p>
                `,
            confirmButtonText: 'OK',
            preConfirm: () => {
                let user=$('#username').val()
                let pwd=$('#password').val()
                if(!user || !pwd)
                    Swal.showValidationMessage("Inserisci username e password.")
                else logIn(user, pwd)
            }
        })
    })
    sliderUpdate($('#sliderPeso'), _valuePeso, "kg")
    sliderUpdate($('#sliderAltezza'), _valueAltezza, "cm")

    for(let i=18; i<61; i++)
        $('<option>').text(i).appendTo(_cmbEta)

    _cmbEta.on("click", function() {
        _cmbEta.css("color", "")
    })
 
    $('#accedi').on("click", function() {
        Swal.fire({
            html: `<h3>Scegli una password: </h3>
                    <input id="password" type="password" class="swal2-input" placeholder="Password"></input>`,
            confirmButtonText: 'OK',
            preConfirm: () => {
                let pwd=$('#password').val()
                if(!pwd)
                    Swal.showValidationMessage("Inserisci password.")
                else goToPage2(pwd)
            }

        })
    })

    function goToPage2(pwd) {
        name=$('#nome').val()
        localStorage.setItem("localName", name)
        age=_cmbEta.val()
        localStorage.setItem("localAge", age)
        if(name!="" && age!="Età")
        {
            let rq=inviaRichiesta("POST", "/api/newUser", {name, pwd})
            rq.then((response) => {
                console.log(response.data)
            })
            window.location.href="pagina2.html"
        }
        else if(name=="")
        {
            $('#nome').addClass("error")
            $('#nome').prop("placeholder", "Inserisci nome")
        }
        else
        {
            _cmbEta.addClass("error")
            //$('#nome').prop("placeholder", "Inserisci nome")
        }
    }

    $('#accedi2').on("click", function() {
        if(sex=="maschio" || sex=="femmina")
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

    if(window.location.pathname.endsWith('pagina2.html'))
        _h2.text("Ciao, "+localStorage.getItem("localName"))

    if(window.location.pathname.endsWith('pagina3.html'))
    {
        if(localStorage.getItem("isUser")=="true")
        {
            _divGPT.hide()
            _menu.show()
            _allenamento.click()
            let nome=localStorage.getItem("localName")
            getScheda(nome)
        }
        localStorage.removeItem("isUser")
    }

    $('.icon').on("click", function() {
        $('.icon').css("background-color", "")
        $(this).css("background-color", "red")
        $(this).css("border-radius", "60px")
        sex=$(this).prop("id")
        _h4.text("Sei: "+sex)
    })

    function sliderUpdate(slider, val, unit) {
        val.prop("innerHTML", slider.val()+" "+unit)
        let percent = (slider.val() - slider.attr("min")) / (slider.attr("max") - slider.attr("min")) * 100
        /*let newPosition = percent + "%"
        val.css("margin-left", newPosition)*/
    }

    $('#accedi3').css("opacity", 0.5)

    //if(_divGPT.children("textarea").val()!="")
        $('#accedi3').css("opacity", 1).on("click", function() {
            goal=_divGPT.children("textarea").val()
            localStorage.setItem("localGoal", goal)
            let userInfo={
                "nome": localStorage.getItem("localName"),
                "eta": localStorage.getItem("localAge"),
                "sesso": localStorage.getItem("localSex"),
                "altezza": localStorage.getItem("localHeight"),
                "peso": localStorage.getItem("localWeight"),
                "obiettivo": localStorage.getItem("localGoal")
            }
            mostraDati()
            newScheda(userInfo)
            newDieta(userInfo)
        })

    $('#allenamento').on("click", function() {
        _divDieta.hide()
        _divEsercizi.show()
        $('#dieta').removeClass("active")
        $('#allenamento').addClass("active")
    }) 

    $('#dieta').on("click", function() {
        _divDieta.show()
        _divEsercizi.hide()
        $('#allenamento').removeClass("active")
        $('#dieta').addClass("active")
    }) 

    function logIn(user, pwd) {
        console.log(user, pwd)
        let rq=inviaRichiesta("POST", "/api/logIn", {user, pwd})
        rq.then((response)=>{
            console.log(response.data)
        })
        rq.catch(function(err) {
            Swal.fire({
                title: 'Username o password errati!',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        })
        rq.then(function(response) {			
            localStorage.setItem('isUser', 'true')		
            window.location.href = "pagina3.html"
        })		
    }

    function mostraDati() {
        _divGPT.hide()
        _menu.show()
        $('#allenamento').click()
    }

    function newDieta(userInfo) {
        let rq=inviaRichiesta("POST", "/api/newDieta", userInfo)
		rq.then((response)=>{
            console.log(response.data)
            appendDieta(response.data)
        })
    }

    function newScheda(userInfo) {
        Swal.fire({
            title: 'Attendi...',
            text: 'Generazione allenamento e dieta in corso.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        let rq=inviaRichiesta("POST", "/api/newScheda", userInfo)
		rq.then((response)=>{
            Swal.close()
            console.log(response.data)
            appendScheda(response.data)
        })
    }

    function getScheda(nome) {
        let rq=inviaRichiesta("GET", `/api/getScheda/${nome}`)
        rq.then((response)=>{
            console.log(response.data)
            appendScheda(response.data.scheda)
            appendDieta(response.data.dieta)
        })
    }

    function appendCard(row, exercise) {
        //Creazione tabella log
        let logTable=$('<table>')

        // Creazione di una colonna con classe "col-md-4" all'interno dell'elemento con id "day1"
        let _col = $('<div>').addClass("col-md-4 mb-4").appendTo(row); // Aggiunta della classe "mb-4" per lo spazio tra le colonne
    
        // Creazione di un elemento div con classe "card" e aggiunta all'interno della colonna
        let _card = $('<div>').addClass("card").appendTo(_col);
    
        // Creazione di un'immagine con classe "card-img-top" e definizione del percorso della sorgente (src)
        $('<img>').prop("src", `img/${exercise.img}`).addClass("card-img-top").appendTo(_card);
    
        // Creazione di un elemento div con classe "card-body" e aggiunta all'interno della card
        let _body = $('<div>').addClass("card-body overflow-auto").appendTo(_card);
    
        // Creazione di un titolo h5 con testo "Titolo" e classe "card-title", e aggiunta all'interno del corpo della card
        $('<h5>').text(exercise.nome).addClass("card-title").appendTo(_body);
    
        // Creazione di un paragrafo con testo "Testo" e classe "card-text", e aggiunta all'interno del corpo della card
        let text=exercise.tutorial.substring(0, 40)
        $('<small>').text(text).addClass("card-text").appendTo(_body)
        $('<small>').css("color", "grey").text(" ...altro").on("click", function() {
            appendLogTable(logTable, exercise.log)
            Swal.fire({
                title: exercise.nome,
                html: `<img src='img/${exercise.img}' style='width:200px;'> <br><br> <small>
                        ${exercise.tutorial}<br><br>Serie: <b>${exercise.set}x${exercise.reps}<b></small>
                        <br><br> <h2 class="text-left">Log</h2> 
                        <small class="text-left" id='logDescription'>Registra i tuoi progressi e supera te stesso di volta
                        in volta.</small><br>`+logTable.prop("outerHTML")
            }).then((result) => {
                if(result.isConfirmed)
                {
                    let reps=$('.logReps')
                    let kg=$('.logWeight')
                    aggiornaLog(exercise.nome, reps, kg)
                }
            })}
        ).appendTo(_body)
        $('<small>').html("<br>Serie: <b>"+exercise.set+"x"+exercise.reps+"<b>").appendTo(_body)
    }

    function appendLogTable(table, log) {
        let txtReps, txtKg
        table.empty()
        let tbody=$('<tbody>').appendTo(table)
        for(let i=0; i<log.length; i++)
        {
            if(log[i].reps!="")
                txtReps=log[i].reps
            else txtReps="n. reps"
            if(log[i].kg!="")
                txtKg=log[i].kg
            else txtKg="kg"
            let tr=$('<tr>').appendTo(tbody)
            $('<td>').text(`set n. ${i+1}`).appendTo(tr)
            let td=$('<td>').appendTo(tr)
            $('<input type="number" min="0">').addClass("logReps").prop("placeholder", txtReps).appendTo(td)
            $('<a>').text(" x ").appendTo(td)
            $('<input type="number" min="0">').addClass("logWeight").prop("placeholder", txtKg).appendTo(td)
        }
    }
    
    function appendScheda(scheda) {
        for(let day in scheda)
        {
            let container=$('<div>').appendTo(_divEsercizi)
            let row = $('<div>').addClass("row").appendTo(container);
            $('<h2>').css("color", "white").text(day).prependTo(container)
            for(let i=0; i<scheda[day].length; i++)
                appendCard(row, scheda[day][i])
        }
    }

    function appendDieta(json) {
        let giorni=["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
        for(let i=0; i<7; i++)
        {
            let _tr=$('<tr>').appendTo(_dietTable)
            $('<td>').addClass("dietDay").text(giorni[i]).appendTo(_tr)
            $('<p>').text("").appendTo(_tr)
            $('<p>').text("").appendTo(_tr)
            $('<p>').html(`<b>Colazione</b>: ${json.dieta[i].colazione}`).appendTo(_tr)
            $('<small>').addClass("alt").css("color", "grey").html(`<b>Alternativa</b>: ${json.dieta[i].colazione_alt}`).appendTo(_tr) 
            $('<p>').text("").appendTo(_tr)   
            $('<p>').text("").appendTo(_tr)          
            $('<p>').html(`<b>Pranzo</b>: ${json.dieta[i].pranzo}`).appendTo(_tr)
            $('<small>').addClass("alt").css("color", "grey").html(`<b>Alternativa</b>: ${json.dieta[i].pranzo_alt}`).appendTo(_tr)
            $('<p>').text("").appendTo(_tr) 
            $('<p>').text("").appendTo(_tr) 
            $('<p>').html(`<b>Snack</b>: ${json.dieta[i].snack}`).appendTo(_tr)
            $('<small>').addClass("alt").css("color", "grey").html(`<b>Alternativa</b>: ${json.dieta[i].snack_alt}`).appendTo(_tr)
            $('<p>').text("").appendTo(_tr)
            $('<p>').text("").appendTo(_tr)  
            $('<p>').html(`<b>Cena</b>: ${json.dieta[i].cena}`).appendTo(_tr)
            $('<small>').addClass("alt").css("color", "grey").html(`<b>Alternativa</b>: ${json.dieta[i].cena_alt}`).appendTo(_tr)
            $('<p>').text("").appendTo(_tr)
            $('<p>').text("").appendTo(_tr)  
        }
    }

    function getLog(nome) {
        let username=localStorage.getItem("localName")
        let rq=inviaRichiesta("GET", `/api/getLog/${username}/${nome}`)
        rq.then((response)=>{
            console.log(response.data)
        })
        //return response.data
    }

    function aggiornaLog(nome, reps, kg) {
        let username=localStorage.getItem("localName")
        let log=[]
        for(let i=0; i<reps.length; i++)
            log.push({"reps": $(reps[i]).val(), "kg": $(kg[i]).val()})
        let rq=inviaRichiesta("POST", "/api/aggiornaLog", {username, nome, log})
    }
}