(function($){
    var Renderer = function(canvas){
      var canvas = $(canvas).get(0)
      var ctx = canvas.getContext("2d");
      var particleSystem
      var dom = $(canvas)

      var that = {
        init:function(system){
          particleSystem = system
          particleSystem.screenSize(canvas.width, canvas.height) 
          particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
          that.initMouseHandling()
        },
        
        redraw:function(){
          ctx.fillStyle = "white"
          ctx.fillRect(0,0, canvas.width, canvas.height)
          
          particleSystem.eachEdge(function(edge, pt1, pt2){
            ctx.strokeStyle = "rgba(88,0,0, .133)"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pt1.x, pt1.y)
            ctx.lineTo(pt2.x, pt2.y)
            ctx.stroke()
          })

          particleSystem.eachNode(function(node, pt){
            var w = 2;   //ширина квадрата
            ctx.fillStyle = (node.name == 'Я') ? 'yellow' : node.data.color
            ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w); //рисуем
            ctx.fillStyle = (node.name == 'Я') ? 'green' : node.data.color; //цвет для шрифта
            ctx.font = (node.name == 'Я') ? 'bold 18px sans-serif' : 'italic 13px sans-serif'; //шрифт
            ctx.fillText (node.name, pt.x+8, pt.y+8); //пишем имя у каждой точки
          })          
        },
        
        initMouseHandling:function(){
          var dragged = null;
          var handler = {
            moved: function(e) {
                var pos = $(canvas).offset();
                _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
                nearest = particleSystem.nearest(_mouseP);
                if (!nearest.node) return false
                $('#status h1').text(nearest.node.data.full_name) 
                $('#status .image').html($('<img>').attr('src', nearest.node.data.image));
                $('#status .ago').html(nearest.node.data.days + '<br>' + nearest.node.data.created_at);

            },

            clicked:function(e){
              var pos = $(canvas).offset();
              _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
              dragged = particleSystem.nearest(_mouseP);

              if (dragged && dragged.node !== null){
                dragged.node.fixed = true
              }

              $(canvas).bind('mousemove', handler.dragged)
              $(window).bind('mouseup', handler.dropped)
              that.redraw();
              return false
            },
            dragged:function(e){
              var pos = $(canvas).offset();
              var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

              if (dragged && dragged.node !== null){
                var p = particleSystem.fromScreen(s)
                dragged.node.p = p
              }

              return false
            },

            dropped:function(e){
              if (dragged===null || dragged.node===undefined) return
              if (dragged.node !== null) dragged.node.fixed = false
              dragged.node.tempMass = 1000
              dragged = null
              $(canvas).unbind('mousemove', handler.dragged)
              $(window).unbind('mouseup', handler.dropped)
              _mouseP = null
              return false
            }
          }
          $(canvas).mousedown(handler.clicked);
          $(canvas).mousemove(handler.moved);

        },
        
      }
      return that
    }    

    $(document).ready(function(){
      var sys = arbor.ParticleSystem(1000, 100, 0.5) // create the system with sensible repulsion/stiffness/friction
    
      sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

      sys.addNode('Я');
      sys.addNode('Кто-то другой');
      $.getJSON('/json', function(response) {
        $.each(response.nodes, function(i,node) {
          sys.addNode(node.name, {
            days: node.days,
            image: node.image, 
            full_name: node.full_name, 
            color: node.color,
            created_at: node.created_at
          });
          sys.addEdge(node.name, 'Я');
        });
      });
     
    })

  })(this.jQuery)