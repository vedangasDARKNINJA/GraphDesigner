var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var NodeMove = false;
var mouseDown = false;
var shiftDown = false;
var lftCtlDown = false;
var markEndPoint=true;
var mousePos={x:0,y:0};

const GraphNodeSize =10;
const MaxEdgeCount = 4;
var Nodes = [];
var Edges =[];
var SelectedNodeIndex = -1;
var SelectedEdgeIndex = -1;
var shiftSelected=[];

class Node
{
    constructor(args)
    {
        this.x = args.x;
        this.y = args.y;

        this.edges=0;
        this.selected = false;
        this.index = -1;

        this.isEndPoint = false;

        this.color = "#878787";
        this.initColor = "#878787";
        this.selectedColor = "#ffe573";
        this.directionalColor="#329c6f";
        this.controlColor = "#f74f4f";
        this.endPointColor="#232323";
    }
    setIndex(i)
    {
        this.index = i;
    }

    setEndPoint()
    {
        if(this.isEndPoint)
        {
            this.isEndPoint = false;
            this.color = this.initColor;
            this.GetEdges();
        }
        else
        {
            this.isEndPoint = true;
            this.color = this.endPointColor;
        }
    }
    draw()
    {
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.beginPath();
        ctx.fillStyle = this.selected?this.selectedColor:this.color;
        ctx.arc(this.x,this.y,GraphNodeSize,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle="#000000";
        ctx.fillText(this.index+1,this.x,this.y+5);
        ctx.closePath();
    }

    GetEdges()
    {
        this.edges = Edges.filter((obj)=>{
                        if(obj.node_1==this || obj.node_2==this)
                        {
                            return obj;
                        }
                    }).length;
        console.log(this.edges);
        if(this.edges==2)
        {
            this.color =this.directionalColor;
        }
        else if(this.edges>2)
        {
            this.color =this.controlColor;
        }
        else if(this.edges<2 && !this.isEndPoint)
        {
            this.color = this.initColor;
        }
        return this.edges;
    }

    GetEdgeMat()
    {
        var e=[];
        this.edgeMat=[];
        for(let i=0;i<Edges.length;i++)
        {
            if(Edges[i].node_1==this)
            {
                e.push(Edges[i].node_2.index);
            }
            else if(Edges[i].node_2==this){
                e.push(Edges[i].node_1.index);
            }
        }
        for(let i=0;i<Nodes.length;i++)
        {
            if(i==this.index)
            {
                this.edgeMat.push(0);
            }
            else if(e.indexOf(i)!=-1)
            {
                this.edgeMat.push(1);
            }
            else{
                this.edgeMat.push(0);
            }
        }
        return this.edgeMat;
    }
}

class Edge
{
    constructor(N1,N2,weight=0)
    {
        this.node_1 = N1;
        this.node_2 = N2;

        this.selected = false;
        this.index = -1;

        this.color = "#232323";
        this.selectedColor = "#77ed96";
        if(weight!=0)
        {
            this.weight = weight;
        }
    }
    setIndex(i)
    {
        this.index = i;
    }
    DistanceToPoint(point)
    {
        var vec1 = {x:this.node_2.x-this.node_1.x,y:this.node_2.y-this.node_1.y};
        var vec1_mag = Math.sqrt(vec1.x*vec1.x + vec1.y*vec1.y);
        var vec1_norm = {x:10*vec1.x/vec1_mag,y:10*vec1.y/vec1_mag};
        var x1 = this.node_1.x + vec1_norm.x;
        var y1 = this.node_1.y + vec1_norm.y;
        var x2 = this.node_2.x - vec1_norm.x;
        var y2 = this.node_2.y - vec1_norm.y;
        if(Math.abs(x1-x2)<GraphNodeSize*0.5)
        {
            var mean = (x1+x2)*0.5;
            if((point.y >= Math.min(y1,y2) && point.y <=Math.max(y1,y2)))
            {
                if(point.x >=mean-5 && point.x <=mean+5)
                {
                    return Math.abs(point.x - mean);
                }
            }
        }
        else if(Math.abs(y1-y2)<GraphNodeSize*0.5)
        {
            var mean = (y1+y2)*0.5;
            if((point.x >= Math.min(x1,x2) && point.x <=Math.max(x1,x2)))
            {
                if(point.y >=mean-5 && point.y <=mean+5)
                {
                    return Math.abs(point.y - mean);
                }
            }
        }
        else
        {
            if((point.x >= Math.min(x1,x2) && point.x <=Math.max(x1,x2))
                &&(point.y >= Math.min(y1,y2) && point.y <=Math.max(y1,y2)))
            {
                var x2_x1 = x2-x1;
                var y2_y1 = y2-y1;
                var denom = Math.sqrt((y2_y1*y2_y1) +(x2_x1*x2_x1));
                var numer = Math.abs(y2_y1*point.x - x2_x1*point.y + x2*y1 - y2*x1);
                return numer/denom;
            }
            else{
                return -1;
            }
        }
    }

    draw()
    {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.selected?this.selectedColor:this.color;
        ctx.moveTo(this.node_1.x,this.node_1.y);
        ctx.lineTo(this.node_2.x,this.node_2.y);
        ctx.stroke();
        ctx.closePath();
    }

    
}


function Distance(p1,p2)
{
    var x =p2.x - p1.x;
    var y =p2.y - p1.y; 
    return Math.sqrt(x*x + y*y);
}

function createNode()
{
    var obj = new Node({x:mousePos.x,y:mousePos.y});
    if(Nodes.indexOf(obj)==-1)
    {
        Nodes.push(obj);
        obj.setIndex(Nodes.length-1);
    }
}

function CheckSelected()
{
    if(!NodeMove)
    {
        var once = false;
        SelectedNodeIndex = -1;
        SelectedEdgeIndex = -1;
        
        for(let i=0;i<Edges.length;i++)
        {
            var dst = Edges[i].DistanceToPoint(mousePos);
            if(dst>=0 && dst < 5 && !once)
            {
                Edges[i].selected = true;
                SelectedEdgeIndex = i;
                once = true;
            }
            else{
                Edges[i].selected = false;
            }
        }
        
        for (let i = 0; i < Nodes.length; i++) {
            if(Distance(Nodes[i],mousePos)<GraphNodeSize+5 && !once)
            {
                Nodes[i].selected = true;
                SelectedNodeIndex = i;
                once = true;
            }
            else{
                if(shiftSelected.indexOf(i)==-1)
                    Nodes[i].selected = false;
            }
        }
    }
}

function MovePoint(index,Position)
{
    Nodes[index].x = Position.x;
    Nodes[index].y = Position.y;
}


function AssociatedEdgesRemove(node)
{
    if(Edges.length>0)
    {
        var index=[];
        for(let i=0;i<Edges.length;i++)
        {
            if(Edges[i].node_1==node || Edges[i].node_2==node)
            {
                index.push(i);
            }
        }

        if(index.length>0)
        {
            for(let i=index.length-1;i>=0;i--)
            {
                Edges.splice(index[i],1);
            }
        }
        
    }
}

function RemoveNode(i)
{
    AssociatedEdgesRemove(Nodes[i]);
    Nodes.splice(i,1);
    RecalculateIndex();
}

function RemoveEdge(i)
{
    Edges.splice(i,1);
    RecalculateIndex();
}

function RecalculateIndex()
{
    for(let i=0;i<Nodes.length;i++)
    {
        Nodes[i].setIndex(i);
        Nodes[i].GetEdges();
    }
    for(let i=0;i<Edges.length;i++)
    {
        Edges[i].setIndex(i);
    }


}

function AdjecencyMat()
{
    var mat=[];
    for (let i = 0; i < Nodes.length; i++) {
        mat.push(Nodes[i].GetEdgeMat());
    }
    //console.log(mat);
    $("table").empty();
    var markUp = "<tr><th></th>";
    for(let i=0;i<Nodes.length;i++)
    {
        markUp+="<th>N"+(i+1)+"</th>";
    }
    markUp+="</tr>";
    for (let x = 0; x < mat.length; x++) {
        markUp+="<tr><th>N"+(x+1)+"</th>"
        for( let y=0;y<mat[x].length;y++)
        {
            markUp+="<td>"+mat[x][y]+"</td>";
        }
        markUp+="</tr>";
    }
    $("table").append(markUp);
}

window.addEventListener('keydown',doKeyDown,true);
window.addEventListener('keyup',doKeyUp,true);

$(document).ready(function () {
    canvas.addEventListener('mousemove', function(evt) {
        mousePos = getMousePos(canvas, evt);
        CheckSelected();
    });

    canvas.addEventListener('mousedown', function(evt) {
        mouseDown = true;
        mousePos = getMousePos(canvas, evt);
        if(SelectedNodeIndex == -1 && SelectedEdgeIndex == -1)
        {
            createNode();
        }
        else if(lftCtlDown && SelectedNodeIndex != -1)
        {
            RemoveNode(SelectedNodeIndex);
        }
        else if(lftCtlDown && SelectedEdgeIndex != -1)
        {
            RemoveEdge(SelectedEdgeIndex);
        }
        else if(shiftDown && SelectedNodeIndex != -1)
        {
            
            shiftSelected.push(SelectedNodeIndex);
            //console.log(shiftSelected);
            if(shiftSelected.length==2)
            {
                if(Nodes[shiftSelected[0]].GetEdges()<MaxEdgeCount && Nodes[shiftSelected[1]].GetEdges()<MaxEdgeCount)
                {
                    var e = new Edge(Nodes[shiftSelected[0]],Nodes[shiftSelected[1]]);
                    if(Edges.filter((obj)=>{
                        if(obj.node_1.index == shiftSelected[0] && obj.node_2.index == shiftSelected[1])
                        {
                            return obj;
                        }
                        else if(obj.node_1.index == shiftSelected[1] && obj.node_2.index == shiftSelected[0])
                        {
                            return obj;
                        }
                    }).length ==0)
                    {
                        Edges.push(e);
                        e.setIndex(Edges.length-1);
                        Nodes[shiftSelected[0]].GetEdges();
                        Nodes[shiftSelected[1]].GetEdges();
                    }
                    shiftSelected=[];
                    CheckSelected();
                }
            }
            
        }
        else if(markEndPoint && SelectedNodeIndex!=-1)
        {
            console.log("toggle endPoint");
            Nodes[SelectedNodeIndex].setEndPoint();
        }
    });

    canvas.addEventListener('mouseup', function(evt) {
        mouseDown = false;
        NodeMove = false;
        mousePos = getMousePos(canvas, evt);
    });
    Update();
});

function ClearAll()
{
    Nodes = [];
    Edges = [];
}

function doKeyUp(e) {
	var code = e.keyCode;
	if(code == 16)
	{
        shiftDown = false;
        shiftSelected = [];
        CheckSelected();
    }
    
    if(code == 17)
	{
		lftCtlDown = false;
    }

    if(code == 69)
    {
        markEndPoint =false;
    }
}

function doKeyDown(e) {
    var code = e.keyCode;
    console.log(code);
	if(code == 16)
	{
		shiftDown = true;
    }

    if(code == 17)
    {
        lftCtlDown = true;
    }

    if(code ==69)
    {
        markEndPoint =true;
    }
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function Update()
{
    if(SelectedNodeIndex!= -1 && mouseDown && !shiftDown && !lftCtlDown && !markEndPoint)
    {
        NodeMove = true;
        MovePoint(SelectedNodeIndex,mousePos);
    }

    ctx.clearRect(0,0,canvas.clientWidth,canvas.height);
    for(let i=0;i<Edges.length;i++)
    {
        Edges[i].draw();
    }
    for (let i = 0; i < Nodes.length; i++) {
        Nodes[i].draw();
    }

    window.requestAnimationFrame(Update);
}