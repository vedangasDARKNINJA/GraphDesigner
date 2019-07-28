var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var NodeMove = false;
var mouseDown = false;
var shiftDown = false;
var lftCtlDown = false;
var markEndPoint=false;
var weightAssigner = false;
var canResetNode=true;

var MatVisible=false;

var mousePos={x:0,y:0};

const GraphNodeSize =10;
const MaxEdgeCount = 4;
var Nodes = [];
var Edges =[];
var adj_mat=[];

var SelectedNodeIndex = -1;
var LastNodeSelected = -1;
var SelectedEdgeIndex = -1;
var shiftSelected=[];

class Node
{
    constructor(args)
    {
        this.x = args.x;
        this.y = args.y;

        this.edges=undefined;
        this.edgesSelectedIndex=[-1,-1,-1,-1];
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
                    });
        console.log(this.edges);
        if(this.edges.length==2)
        {
            this.color =this.directionalColor;
        }
        else if(this.edges.length>2)
        {
            this.color =this.controlColor;
        }
        else if(this.edges.length<2 && !this.isEndPoint)
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
                this.edgeMat.push(10);
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
        this.node_1_weight=0;
        this.node_2_weight=0;
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


class RadialSelector
{
    static Initialise()
    {
        RadialSelector.discBG = "#303030";
        RadialSelector.selectorFG = "#6eb6e0";
        RadialSelector.optionFG = "#c2c2c2";
        RadialSelector.optionFGSelected = "#6eb6e0";
        RadialSelector.weightAssignedColor = "#ffb756";
        RadialSelector.TextCol = "#FEFEFE";
        RadialSelector.options=["L","R","F","B"];
        RadialSelector.selectedOption=undefined;
        RadialSelector.oppositeOption=undefined;
        RadialSelector.size = 15;
        RadialSelector.offset = 40;
        RadialSelector.timeElapsed=0;
        RadialSelector.choosingEdge=false;
        RadialSelector.edgesSelectedIndex=[-1,-1,-1,-1];
        RadialSelector.angle =0
    }

    static GetAngle(node,point)
    {
        var y = point.y-node.y;
        var x =point.x -node.x;
        RadialSelector.angle = Math.atan2(y,x);
    }

    static Activate(node,time)
    {

        ctx.beginPath();
        var d = Distance(Nodes[SelectedNodeIndex],mousePos)
        if(d<GraphNodeSize)
        {
            ctx.fillStyle=RadialSelector.optionFGSelected;
            canResetNode=true;
        }
        else
        {
            ctx.fillStyle=RadialSelector.optionFG;
            canResetNode=false;
        }
        ctx.arc(node.x,node.y,RadialSelector.size*(RadialSelector.timeElapsed/time),0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle= RadialSelector.TextCol;
        ctx.fillText("X",node.x,node.y+3);
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.arc(node.x,node.y,RadialSelector.size*(RadialSelector.timeElapsed/time),0,2*Math.PI,false);
        ctx.strokeStyle = this.discBG;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 6;
        if(!RadialSelector.choosingEdge)
        {
            RadialSelector.GetAngle(node,mousePos);
        }
        ctx.arc(node.x,node.y,RadialSelector.size*(RadialSelector.timeElapsed/time),RadialSelector.angle-(Math.PI/6),RadialSelector.angle+(Math.PI/6),false);
        ctx.strokeStyle = this.selectorFG;
        ctx.stroke();
        ctx.closePath();
        var a = RadialSelector.angle*180/Math.PI;
        if(a<0)
        {
            a+=360;
        }
        if(((a>345&&a<360)||(a>=0 && a<15)) && d>GraphNodeSize)
        {
            RadialSelector.selectedOption = RadialSelector.options[1];
            RadialSelector.oppositeOption = RadialSelector.options[0];
        }
        else if((a>165 && a<195)&& d>GraphNodeSize)
        {
            RadialSelector.selectedOption = RadialSelector.options[0];
            RadialSelector.oppositeOption = RadialSelector.options[1];
        }
        else if((a>255 && a<285)&& d>GraphNodeSize)
        {
            RadialSelector.selectedOption = RadialSelector.options[2];
            RadialSelector.oppositeOption = RadialSelector.options[3];
        }
        else if((a>75 && a<105)&& d>GraphNodeSize)
        {
            RadialSelector.selectedOption = RadialSelector.options[3];
            RadialSelector.oppositeOption = RadialSelector.options[2];
        }
        else{
            RadialSelector.selectedOption = undefined;
            RadialSelector.oppositeOption = undefined;
        }
        var sel = RadialSelector.selectedOption;


        ctx.beginPath();
        if(node.edgesSelectedIndex[1]==-1)
        {
            ctx.fillStyle = sel==RadialSelector.options[1] ? RadialSelector.optionFGSelected:RadialSelector.optionFG;
        }
        else{
            ctx.fillStyle = RadialSelector.weightAssignedColor;
        }
        ctx.arc(node.x + RadialSelector.offset*(RadialSelector.timeElapsed/time),node.y,0.75*RadialSelector.size,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle = RadialSelector.TextCol;
        ctx.fillText(RadialSelector.options[1],node.x + RadialSelector.offset*(RadialSelector.timeElapsed/time),node.y+2);
        ctx.closePath();

        ctx.beginPath();
        if(node.edgesSelectedIndex[0]==-1)
        {
            ctx.fillStyle = sel==RadialSelector.options[0] ? RadialSelector.optionFGSelected:RadialSelector.optionFG;
        }
        else{
            ctx.fillStyle = RadialSelector.weightAssignedColor;
        }
        ctx.arc(node.x - RadialSelector.offset*(RadialSelector.timeElapsed/time),node.y,0.75*RadialSelector.size,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle = RadialSelector.TextCol;
        ctx.fillText(RadialSelector.options[0],node.x - RadialSelector.offset*(RadialSelector.timeElapsed/time),node.y+2);
        ctx.closePath();

        ctx.beginPath();
        if(node.edgesSelectedIndex[2]==-1)
        {
            ctx.fillStyle = sel==RadialSelector.options[2] ? RadialSelector.optionFGSelected:RadialSelector.optionFG;
        }
        else{
            ctx.fillStyle = RadialSelector.weightAssignedColor;
        }
        ctx.arc(node.x,node.y - RadialSelector.offset*(RadialSelector.timeElapsed/time),0.75*RadialSelector.size,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle = RadialSelector.TextCol;
        ctx.fillText(RadialSelector.options[2],node.x,node.y+2- RadialSelector.offset*(RadialSelector.timeElapsed/time));
        ctx.closePath();

        ctx.beginPath();
        if(node.edgesSelectedIndex[3]==-1)
        {
            ctx.fillStyle = sel==RadialSelector.options[3] ? RadialSelector.optionFGSelected:RadialSelector.optionFG;
        }
        else{
            ctx.fillStyle = RadialSelector.weightAssignedColor;
        }
        ctx.arc(node.x,node.y + RadialSelector.offset*(RadialSelector.timeElapsed/time),0.75*RadialSelector.size,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle = RadialSelector.TextCol;
        ctx.fillText(RadialSelector.options[3],node.x,node.y+2+RadialSelector.offset*(RadialSelector.timeElapsed/time));
        ctx.closePath();
        if(RadialSelector.timeElapsed<time)
            RadialSelector.timeElapsed++;
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
    if(!NodeMove && !weightAssigner || RadialSelector.choosingEdge)
    {
        var once = false;
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
        if(!RadialSelector.choosingEdge)
        {
            SelectedNodeIndex = -1;
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
    AdjecencyMat();
    if(MatVisible)
        ShowAdjecencyMat();
}

function ResetNode(Selectedindex)
{
    console.log(Selectedindex);
    var arr = Nodes[Selectedindex].edgesSelectedIndex;
    console.log(arr);
    for(let i =0;i<arr.length;i++)
    {
        if(arr[i] != -1)
        {
            Edges[arr[i]].node_1_weight=0;
            Edges[arr[i]].node_2_weight=0;
            if(Edges[arr[i]].node_1 == Nodes[Selectedindex])
            {
                var index = Edges[arr[i]].node_2.edgesSelectedIndex.indexOf(arr[i]);
                Edges[arr[i]].node_2.edgesSelectedIndex[index] = -1;
            }
            else{
                var index = Edges[arr[i]].node_1.edgesSelectedIndex.indexOf(arr[i]);
                Edges[arr[i]].node_1.edgesSelectedIndex[index] = -1;
            }

            var a = Edges[arr[i]].node_1.index;
            var b = Edges[arr[i]].node_2.index;
            adj_mat[a][b]=10;
            adj_mat[b][a]=10;
        }
    }
    Nodes[Selectedindex].edgesSelectedIndex = [-1,-1,-1,-1];
    arr = Nodes[Selectedindex].edgesSelectedIndex;
    console.log(arr);
}



function ResetEdges()
{
    for (let i = 0; i < Nodes.length; i++) {
        ResetNode(i);
    }
    AdjecencyMat();
    ShowAdjecencyMat();
}

function ShowAdjecencyMat()
{
    $("table").empty();
    var markUp = "<tr><th></th>";
    for(let i=0;i<Nodes.length;i++)
    {
        markUp+="<th>N"+(i+1)+"</th>";
    }
    markUp+="</tr>";
    for (let x = 0; x < adj_mat.length; x++) {
        markUp+="<tr><th>N"+(x+1)+"</th>"
        for( let y=0;y<adj_mat[x].length;y++)
        {
            markUp+="<td>"+adj_mat[x][y]+"</td>";
        }
        markUp+="</tr>";
    }
    $("table").append(markUp);
}


function AdjecencyMat()
{
    adj_mat=[];
    for (let i = 0; i < Nodes.length; i++) {
        adj_mat.push(Nodes[i].GetEdgeMat());
    }
}

function AdjecencyMatButton()
{
    if(adj_mat.length==0)
    {
        AdjecencyMat();
    }
    ShowAdjecencyMat();
    MatVisible=true;
}

window.addEventListener('keydown',doKeyDown,true);
window.addEventListener('keyup',doKeyUp,true);

$(document).ready(function () {
    RadialSelector.Initialise();
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
            AdjecencyMat();
            if(MatVisible)
                ShowAdjecencyMat();
            CheckSelected();
        }
        else if(weightAssigner)
        {
            if(RadialSelector.selectedOption!=undefined && !RadialSelector.choosingEdge)
            {
                console.log("choose an edge");
                RadialSelector.choosingEdge=true;
            }
            else if(RadialSelector.choosingEdge && SelectedEdgeIndex!=-1)
            {
                if(Edges[SelectedEdgeIndex].node_1 == Nodes[SelectedNodeIndex])
                {
                    console.log("Edge Selected for ("+RadialSelector.selectedOption +"): " + SelectedEdgeIndex);
                    Edges[SelectedEdgeIndex].node_1.edgesSelectedIndex[RadialSelector.options.indexOf(RadialSelector.selectedOption)] = SelectedEdgeIndex;
                    Edges[SelectedEdgeIndex].node_2.edgesSelectedIndex[RadialSelector.options.indexOf(RadialSelector.oppositeOption)] = SelectedEdgeIndex;
                    switch(RadialSelector.options.indexOf(RadialSelector.selectedOption))
                    {
                        case 0:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = -1;
                            Edges[SelectedEdgeIndex].node_2_weight = 1;
                            break;
                        }
                        case 1:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = 1;
                            Edges[SelectedEdgeIndex].node_2_weight = -1;
                            break;
                        }
                        case 2:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = 2;
                            Edges[SelectedEdgeIndex].node_2_weight = -2;
                            break;
                        }
                        case 3:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = -2;
                            Edges[SelectedEdgeIndex].node_2_weight = 2;
                            break;
                        }
                    }
                    var i=Edges[SelectedEdgeIndex].node_1.index;
                    var j=Edges[SelectedEdgeIndex].node_2.index;
                    adj_mat[i][j] = Edges[SelectedEdgeIndex].node_1_weight;
                    adj_mat[j][i] = Edges[SelectedEdgeIndex].node_2_weight;
                    ShowAdjecencyMat();
                }
                else if(Edges[SelectedEdgeIndex].node_2 == Nodes[SelectedNodeIndex])
                {
                    Edges[SelectedEdgeIndex].node_2.edgesSelectedIndex[RadialSelector.options.indexOf(RadialSelector.selectedOption)] = SelectedEdgeIndex;
                    Edges[SelectedEdgeIndex].node_1.edgesSelectedIndex[RadialSelector.options.indexOf(RadialSelector.oppositeOption)] = SelectedEdgeIndex;
                    switch(RadialSelector.options.indexOf(RadialSelector.selectedOption))
                    {
                        case 0:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = 1;
                            Edges[SelectedEdgeIndex].node_2_weight = -1;
                            break;
                        }
                        case 1:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = -1;
                            Edges[SelectedEdgeIndex].node_2_weight = 1;
                            break;
                        }
                        case 2:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = -2;
                            Edges[SelectedEdgeIndex].node_2_weight = 2;
                            break;
                        }
                        case 3:
                        {
                            Edges[SelectedEdgeIndex].node_1_weight = 2;
                            Edges[SelectedEdgeIndex].node_2_weight = -2;
                            break;
                        }
                    }
                    var i=Edges[SelectedEdgeIndex].node_1.index;
                    var j=Edges[SelectedEdgeIndex].node_2.index;
                    adj_mat[i][j] = Edges[SelectedEdgeIndex].node_1_weight;
                    adj_mat[j][i] = Edges[SelectedEdgeIndex].node_2_weight;
                    ShowAdjecencyMat();
                }
                else{
                    console.error("Selected edge does not have the selected node as one of its endpoints");
                }
                RadialSelector.choosingEdge=false;
                CheckSelected();
            }
            else if(canResetNode)
            {
                console.log("resetNode");
                ResetNode(SelectedNodeIndex);
                ShowAdjecencyMat();
            }
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
            if(shiftSelected.length==2 && shiftSelected[0]!= shiftSelected[1])
            {
                if(Nodes[shiftSelected[0]].GetEdges().length<MaxEdgeCount && Nodes[shiftSelected[1]].GetEdges().length<MaxEdgeCount)
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
                        AdjecencyMat();
                        if(MatVisible)
                            ShowAdjecencyMat();
                    }
                    shiftSelected=[];
                    CheckSelected();
                }
            }
            
        }
        else if(markEndPoint && SelectedNodeIndex!=-1)
        {
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

    if(code ==87)
    {
        weightAssigner = false;
        CheckSelected();
        RadialSelector.timeElapsed = 0;
        RadialSelector.choosingEdge = false;
    }
}

function doKeyDown(e) {
    var code = e.keyCode;
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
    if(code ==87)
    {
        weightAssigner = true;
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
    if(SelectedNodeIndex!= -1 && mouseDown && !shiftDown && 
        !lftCtlDown && !markEndPoint & !weightAssigner)
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
    if(weightAssigner && SelectedNodeIndex != -1 || RadialSelector.choosingEdge)
    {
        if(adj_mat.length==0)
        {
            AdjecencyMat();
        }
        RadialSelector.Activate(Nodes[SelectedNodeIndex],10);
    }
    window.requestAnimationFrame(Update);
}