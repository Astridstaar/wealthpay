$(function(){
	var rates = [], directions = [], allowed_to = [];
	var ur = '/site/get-rates';
	$.ajax({
		type:'post',
		url:ur,
		success:function(r){
			rates = JSON.parse(r);

					//select style
			$('#calc-form select, .update-ava input').styler({
				onFormStyled:function(){
					var from_cur = $('#csel1').val(),
						to_cur = $('#csel2').val();
					//change select 2 items according to directions
					allowed_to = directions=  [];
					directions = rates.filter(function(el){
						// console.log(el.from);
						return el.from == from_cur;
					});

					$.each(directions, function(index, rat){
						allowed_to.push(rat.to);
					});
					$('#csel2').find('option').each(function(i, v) {
						if ( allowed_to.indexOf(parseInt($(v).val())) === -1)
							$(v).prop('disabled', true);
						else
							$(v).prop('disabled', false);
					});
					$('#csel2').trigger('refresh');
				}
			});

            showExchangeRate($('#csel1').val(), $('#csel2').val());
		}
	});

    $('#calc')
        .on('keyup', '#calc-form input.form-control', function(event) {
            calculate($(this), false);
        })
        .on('keypress', '#calc-form input.form-control', function(event) {
            return fun_AllowOnlyAmountAndDot(this.id);
        })
        .on('change', '#calc-form select', function(event) {
            var from_cur = $('#csel1').val(),
                to_cur = $('#csel2').val();
            //change select 2 items according to directions
            allowed_to = directions =  [];
            directions = rates.filter(function(el){
                // console.log(el.from);
                return el.from == from_cur;
            });

            $.each(directions, function(index, rat){
                allowed_to.push(rat.to);
            });
            $('#csel2').find('option').each(function(i, v) {
                if ( allowed_to.indexOf(parseInt($(v).val())) === -1)
                    $(v).prop('disabled', true);
                else
                    $(v).prop('disabled', false);
            });
            $('#csel2').trigger('refresh');

            //show currencyy logo
            var $this = $(this);

            if($this.val()>=1){
                $this.parent().parent().find('.currency').hide();
                $this.parent().parent().find('.clog'+$this.val()).show();

                if($('#from_sum').val().length>0){
                    calculate($('#from_sum'), true)
                }
                if(from_cur === to_cur || allowed_to.indexOf(parseInt(to_cur)) === -1){
                    try{
                        $('#csel2').val(allowed_to[0]).change();
                    }
                    catch(e){
                        $('.excherr').fadeIn()
                    }

                }else{
                    $('.excherr').fadeOut()
                }
            }

            showExchangeRate(from_cur, to_cur);
        })
    ;

    function showExchangeRate(from_cur, to_cur) {
        $.each(rates, function(index, rate){
            if(rate.from == from_cur && rate.to == to_cur){
                $("#rate-value").text(rate.rate);
            }
        });
    }

	function calculate(thiss, select) {
        var to = $('#to_sum'),
            from = $('#from_sum'),
            com = $('#from-with-com'),
            fromCur = $('#csel1'),
            toCur = $('#csel2'),
            fromCurValue = fromCur.val(),
            toCurValue = toCur.val(),
            fromCurPrecision = fromCur.find("option:selected").data("precision"),
            toCurPrecision = toCur.find("option:selected").data("precision"),
            lastValue = $('#csel1 option:last-child').val(),
            RATE = DEF = 1,
            PM_COMM = 0.5/100,
            WMZ_COMM = 0.8/100,
            PM_ID = 2,
            PM_EUR_ID = 15,
            WMZ_ID = 3,
            WME_ID = 19,
            WMR_ID = 22,
            comval = 0,
            MSUM = MFEE = bffixed = bfperc = 0;

		localStorage.setItem('f',fromCurValue);
		$.each(rates, function(index, rate){
			if(rate.from == fromCurValue && rate.to == toCurValue){
				RATE = parseFloat(rate.rate);
				DEF = parseFloat(rate.def);
				MSUM = parseFloat(rate.msum);
				MFEE = parseFloat(rate.mfee);
				bffixed = parseFloat(rate.bffixed);
				bfperc = parseFloat(rate.bfperc)/100;
			}
		});

		var val;
		
		//check for comma
		if(thiss.val().indexOf(',')!==-1){
			thiss.val(thiss.val().replace(',','.'));
		}

		//current field is fee 
		if(thiss.hasClass('little-input')){
			if ((fromCurValue == PM_ID) || (fromCurValue == PM_EUR_ID)) {
				fromval = thiss.val()*1 - (thiss.val()*PM_COMM);
			}
			else if ((fromCurValue == WMZ_ID) || (fromCurValue == WME_ID) || (fromCurValue == WMR_ID)) {
				var wmcom = thiss.val()*WMZ_COMM;
				wmcom = (wmcom>=50)?50:wmcom;
				fromval = thiss.val()*1 - wmcom.toFixed(2); //fixes some math mistakes
			}else{
				fromval = thiss.val()*1;
			}
			val = 0;
			//check if value more than min sum
			if(MFEE>0 || bffixed>0 || bfperc>0)
				$('.left-notification').fadeIn();
			else
				$('.left-notification').fadeOut();

			if(thiss.val()*1<MSUM){
				val = fromval - (fromval*(1.0-RATE).toFixed(8)*1 + fromval*bfperc) - MFEE - bffixed;

			}else{
				fromval+=0.01;
				val = fromval - (fromval*(1.0-RATE).toFixed(8)*1 + fromval*bfperc)  - bffixed;
			}
			
			from.val(fromval.toFixed(fromCurPrecision));
			
			if(val<=0)
				val = 0;

			to.val(val.toFixed(toCurPrecision));

			income =  fromval*DEF-fromval*RATE;
			if(income<0)
				income = 0;
			$('#income').val(income.toFixed(2));

		}
		//current fields is to sum
		else if(thiss.hasClass('tosum')){
			
			var rated = thiss.val()/RATE;
			
			if(MFEE>0 || bffixed>0 || bfperc>0)
				$('.left-notification').fadeIn();
			else
				$('.left-notification').fadeOut();

			if(rated<MSUM){
				val = (thiss.val()*1 + MFEE + bffixed) / (1 - ((1.0-RATE).toFixed(8)*1 + bfperc));
			}else{
				// val = rated;
				val = (thiss.val()*1 + bffixed) / (1 - ((1.0-RATE).toFixed(8)*1 + bfperc));
			}
			val = val.toFixed(fromCurPrecision);
			from.val(val);

			if ((fromCurValue == PM_ID) || (fromCurValue == PM_EUR_ID)) {
				comval = val*1 +val*PM_COMM;
			}
			else if ((fromCurValue == WMZ_ID) || (fromCurValue == WME_ID) || (fromCurValue == WMR_ID)) {
				var wmcom = val*WMZ_COMM;
				wmcom = (wmcom>=50)?50:wmcom;
				comval = val*1 + wmcom;
			}
			else{
				comval = val*1;
			}

			com.val(comval.toFixed(2));

			income =  val*DEF-val*RATE;
			if(income<0)
				income = 0;
			$('#income').val(income.toFixed(2));

		}
		//current fields is from sum
		else{
			if ((fromCurValue == PM_ID) || (fromCurValue == PM_EUR_ID)) {
				comval = thiss.val()*1 +(thiss.val()*PM_COMM);
			}
			else if ((fromCurValue == WMZ_ID) || (fromCurValue == WME_ID) || (fromCurValue == WMR_ID)) {
				var wmcom = thiss.val()*WMZ_COMM;
				wmcom = (wmcom>=50)?50:wmcom;
				comval = thiss.val()*1 + wmcom;
			}
			else{
				comval = thiss.val()*1;
			}
			com.val(comval.toFixed(2));
			val = thiss.val()*1;
			//check if value more than min sum
			
			if(MFEE>0 || bffixed>0 || bfperc>0)
				$('.left-notification').fadeIn();
			else
				$('.left-notification').fadeOut();

			if(thiss.val()*1<MSUM){
				val = val - (val*(1.0-RATE).toFixed(8)*1 + val*bfperc) - MFEE - bffixed;
			}else{
				val = val - (val*(1.0-RATE).toFixed(8)*1 + val*bfperc) - bffixed;
			}
			if(val<=0)
				val = 0;

			to.val(val.toFixed(toCurPrecision));


			income =  thiss.val()*DEF-thiss.val()*RATE;
			if(income<0)
				income = 0;
			$('#income').val(income.toFixed(2));
		}

		if(!select){
			if(fromCurValue === toCurValue){
				$('#csel1').val(fromCurValue).attr('selected','selected').trigger('refresh').change();
				var sel2 = (fromCurValue===lastValue)?fromCurValue-1:2;
				$('#csel2').val(sel2).attr('selected','selected').trigger('refresh').change();
			}
		}

		thiss.focus();
	}


	//edit in accaunt
	$('.edit').on('click', function(e){
		e.preventDefault();
		var input = $(this).next(),
			span = $(this).prev();

		input.toggleClass('hide');

		if(input.is(':visible')){
			span.hide();
			input.focus();
		}else{
			span.show();
		}
	});

	//submit in account
	$('#account-form').on('submit', function(e){
		e.preventDefault();
		var input = $(this).find(".inputs"),
			span = $(this).find('.item-cnt'),
			star = '*',
			val = $(input).val();

		if(val.length>0){
			val2 = star.repeat(val.length);
			//here will be ajax change of password
			$.ajax({
				type:'post',
				url:input.data('link'),
				data:'pass='+val,
				success:function(){

					$(span).text(val2);
					$(input).addClass('hide');
					$(span).show();
				}
			});
		}
        else{
			$(input).addClass('hide');
			$(span).show();
		}
	});




	//help on rates
	var showing = false;

	$('.rates td')
        .on('mouseover', function(e){
            var help = $(this).find('.help');
            help.removeClass('hide');
            showing = true;
        })
        .on('mousemove',function(event){
            var help = $(this).find('.help');
            var p = getMousePosition(event);
            if(showing)
                help.css({left:p.x+10+'px',top:p.y+10+'px'})
        })
        .on('mouseout', function(e){
            var help = $(this).find('.help');
            help.addClass('hide');
            showing = false;
        });


	//showing upload in account
	$('.avatar').hover(function(e){
		$(this).find('.update-ava').fadeIn();
	},function(e){
		$(this).find('.update-ava').fadeOut();
	});
	

	//in account request payment
	$('.reqpay').on('click', function(event){
		event.preventDefault();
		$('#basic-modal-content').modal();
	});

	//modal form handling
	$('.modal-ok').on('click', function(event){
		event.preventDefault();
		var inputs = $('.form-style-2').find('input[type="text"]'),
			data = '',
			pm = $(inputs[0]).val(),
			wm = $(inputs[1]).val();
		if(pm.length>0){
			data += 'Parnters[requisite]=Perfect Money: '+pm;
		}

		if(wm.length>0){
			if(data.length==0)
				data += 'Parnters[requisite]=WMZ: '+wm;
		}
	});

	$('a.language').on('click', function(e){
		e.preventDefault();
		var lang = $(this).data('lang');
			token = $(this).data('tk');

		$.ajax({
			type:'post',
			url:$(this).attr('href'),
			data:'_lang='+lang+'&YII_CSRF_TOKEN='+token,
			success:function(res){
				window.location.reload();
			}
		});

	});

	//hide payment message
	$('a.close').on('click', function(e){
		e.preventDefault();
		$(this).parent().parent().fadeOut(350);
	});

});

getMousePosition = function(e) {
		var posx = 0,
			posy = 0;

		if (!e) var e = window.event;

		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
		}

		return { 'x': posx, 'y': posy };
	};

function fun_AllowOnlyAmountAndDot(txt) {
    if (event.keyCode > 47 && event.keyCode < 58 || event.keyCode == 46) {
        var txtbx = document.getElementById(txt);
        var amount = document.getElementById(txt).value;
        var present = 0;
        var count = 0;
        var precision;

        if (txt == "from_sum") {
            precision = $("#csel1 option:selected").data("precision");
        } else {
            precision = $("#csel2 option:selected").data("precision");
        }

        do
        {
            present = amount.indexOf(".", present);
            if (present != -1) {
                count++;
                present++;
            }
        }
        while (present != -1);
        if (present == -1 && amount.length == 0 && event.keyCode == 46) {
            event.keyCode = 0;
            //alert("Wrong position of decimal point not  allowed !!");
            return false;
        }

        if (count >= 1 && event.keyCode == 46) {
            event.keyCode = 0;
            //alert("Only one decimal point is allowed !!");
            return false;
        }
        if (count == 1) {
            var lastdigits = amount.substring(amount.indexOf(".") + 1, amount.length);
            if (lastdigits.length >= precision) {
                //alert("Two decimal places only allowed");
                event.keyCode = 0;
                return false;
            }
        }
        return true;
    }
    else {
        event.keyCode = 0;
        return false;
    }

}
