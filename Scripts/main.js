var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var snap = false;

var gridScale=10;


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

var currentOrigin={x:0,y:0};
var originAtNode=false;
var scaleUnity = 1;

var autoWeights=false;


var JSONNodes=[];


class Node
{
    constructor(args)
    {
        this.x = args.x;
        this.y = args.y;

        this.unityX=0;
        this.unityY=0;

        this.X_origin=0;
        this.Y_origin=0;

        this.edges=undefined;
        this.edgesSelectedIndex=[-1,-1,-1,-1];
        this.selected = false;
        this.index = -1;

        this.isEndPoint = false;
        this.isStartPoint= false;

        this.color = "#656565";
        this.initColor = "#656565";
        this.selectedColor = "#ffe573";
        this.directionalColor="#329c6f";
        this.controlColor = "#f74f4f";
        this.endPointColor="#f598ce";
        this.startPointColor="#98ebf5";
        this.textCol = "#ffffff";
    }
    setIndex(i)
    {
        this.index = i;
    }

    setEndPoint()
    {
        if(adj_mat.length==0)
        {
            AdjecencyMat();
        }
        if(this.isEndPoint)
        {
            this.isEndPoint = false;
            this.color = this.initColor;
            adj_mat[SelectedNodeIndex][SelectedNodeIndex]=0;
        }
        else
        {
            this.isEndPoint = true;
            this.isStartPoint = false;
            this.color = this.endPointColor;
            adj_mat[SelectedNodeIndex][SelectedNodeIndex]=100;
        }
        ShowAdjecencyMat();
    }

    setStartPoint()
    {
        if(adj_mat.length==0)
        {
            AdjecencyMat();
        }
        if(this.isStartPoint)
        {
            this.isStartPoint = false;
            this.color = this.initColor;
            adj_mat[SelectedNodeIndex][SelectedNodeIndex]=0;
        }
        else
        {
            this.isStartPoint= true;
            this.isEndPoint = false;
            this.color = this.startPointColor;
            adj_mat[SelectedNodeIndex][SelectedNodeIndex]=-100;
        }
        ShowAdjecencyMat();
    }

    draw()
    {
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.beginPath();
        ctx.fillStyle = this.selected?this.selectedColor:this.color;
        ctx.arc(this.x,this.y,GraphNodeSize,0,2*Math.PI,false);
        ctx.fill();
        ctx.fillStyle=this.textCol;
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
    if(snap)
    {
        NearestPoint();
    }
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

function MovePoint(index)
{
    if(snap)
    {
        NearestPoint();
    }
    Nodes[index].x = mousePos.x;
    Nodes[index].y = mousePos.y;
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
    if(!MatVisible)
    {
        MatVisible=true;
    }
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

function ChangeOrigin()
{
    if(parseInt($("#originSelect").val())==0)
    {
        originAtNode = false;
    }
    else if(parseInt($("#originSelect").val())==1)
    {
        originAtNode = true;
    }
}

function SetUnityCoordinates()
{
    if(Nodes.length>0)
    {
        for(let i=0;i<Nodes.length;i++)
        {
            if(currentOrigin.x!=0 && currentOrigin.y!=0)
            {
                Nodes[i].unityX= scaleUnity*Nodes[i].X_origin/gridScale;
                Nodes[i].unityY= scaleUnity*Nodes[i].Y_origin/gridScale;

                //console.log({x:Nodes[i].unityX,y:Nodes[i].unityY});
            }
        }
    }
    var x = scaleUnity*(mousePos.x- currentOrigin.x) / gridScale;
    var y = scaleUnity*(currentOrigin.y-mousePos.y)/ gridScale;
    $("#snap_coords").html('X: '+x+' Y: ' +y);
}

function getRelativePoints()
{
    if(Nodes.length>0)
    {
        for(let i=0;i<Nodes.length;i++)
        {
            if(currentOrigin.x!=0 && currentOrigin.y!=0)
            {
                Nodes[i].X_origin = Nodes[i].x - currentOrigin.x;
                Nodes[i].Y_origin = currentOrigin.y -Nodes[i].y;
            }
        }
    }
}

function CreateJSONObject()
{
    JSONNodes=[];
    for (let i = 0; i < Nodes.length; i++) {
        JSONNodes.push({x:Nodes[i].unityX,z:Nodes[i].unityY,edges:Nodes[i].edgeMat});
    }
    console.log(JSON.stringify(JSONNodes));
}

function AutomaticEdges()
{
    AdjecencyMatButton();
    if(snap)
    {
        for (var i = 0; i < Edges.length; i++)
        {
            getDirections(Edges[i]);
        } 
    }
}

function getDirections(edge)
{
    var i=edge.node_1.index;
    var j=edge.node_2.index;

    if(edge.node_1.x == edge.node_2.x)
    {
        console.log("Y direction");
        if(edge.node_1.y>edge.node_2.y)
        {
            edge.node_1_weight = 2;
            edge.node_2_weight = -2;
        }
        else
        {
            edge.node_1_weight = -2;
            edge.node_2_weight = 2;
        }
    }
    else if(edge.node_1.y == edge.node_2.y)
    {
        console.log("X direction");
        if(edge.node_1.x>edge.node_2.x)
        {
            edge.node_1_weight = -1;
            edge.node_2_weight = 1;
        }
        else
        {
            edge.node_1_weight = 1;
            edge.node_2_weight = -1;
        }
    }

    adj_mat[i][j] = edge.node_1_weight;
    adj_mat[j][i] = edge.node_2_weight;
    ShowAdjecencyMat();
}


window.addEventListener('keydown',doKeyDown,true);
window.addEventListener('keyup',doKeyUp,true);
$(document).on('change','#originSelect',ChangeOrigin);


function drawGrid()
{
    ctx.strokeStyle ="#9b9b9b";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i+=gridScale) {
        ctx.beginPath();
        ctx.moveTo(i,0);
        ctx.lineTo(i,canvas.height);
        ctx.stroke();
        ctx.closePath();
    }
    for (let i = 0; i < canvas.height; i+=gridScale) {
        ctx.beginPath();
        ctx.moveTo(0,i);
        ctx.lineTo(canvas.width,i);
        ctx.stroke();
        ctx.closePath();
    }
}

function NearestPoint()
{
    var x = mousePos.x%gridScale;
    var y = mousePos.y%gridScale;

    if(x>gridScale*0.5)
    {
        x = Math.ceil(mousePos.x/gridScale) * gridScale;
    }
    else
    {
        x = Math.floor(mousePos.x/gridScale) * gridScale;
    }

    if(y>gridScale*0.5)
    {
        y = Math.ceil(mousePos.y/gridScale) * gridScale;
    }
    else
    {
        y = Math.floor(mousePos.y/gridScale) * gridScale;
    }
    mousePos.x = x;
    mousePos.y = y;
    if(!shiftDown && !lftCtlDown && !weightAssigner && !markEndPoint)
    {
        ctx.fillStyle="#808080";
        ctx.beginPath();
        ctx.arc(x,y,gridScale<=GraphNodeSize?gridScale*0.5:GraphNodeSize,0,2*Math.PI,false);
        ctx.fill();
        ctx.closePath();
    }
}

function DrawOrigin()
{
    if(originAtNode && Nodes.length>0)
    {
        currentOrigin.x = Nodes[0].x;
        currentOrigin.y = Nodes[0].y;

        ctx.strokeStyle="#335522";
        ctx.beginPath();
        ctx.moveTo(currentOrigin.x,0);
        ctx.lineTo(currentOrigin.x,canvas.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(0,currentOrigin.y);
        ctx.lineTo(canvas.width,currentOrigin.y);
        ctx.stroke();
        ctx.closePath();
    }
    else{
        currentOrigin.x = canvas.width/2;
        currentOrigin.y = canvas.height/2;
        ctx.strokeStyle="#335522";
        ctx.beginPath();
        ctx.moveTo(canvas.width/2,0);
        ctx.lineTo(canvas.width/2,canvas.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(0,canvas.height/2);
        ctx.lineTo(canvas.width,canvas.height/2);
        ctx.stroke();
        ctx.closePath();
    }
}

$(document).ready(function () {
    $("#snap").change(function(){
        snap = !snap;
        if(snap)
        {
            $(".snap_props").append('<select name="origin_select" id="originSelect"><option value="0">Origin at canvas center</option><option value="1">Origin at Node 1</option></select>');
            gridScale = parseInt($("#gridSlider").val())*10;
            $("#sliderOutput").text($("#gridSlider").val());
            $(".slidecontainer").css("display","inline-block");
            $("#gridSlider").on('input',function(){
                gridScale = parseInt($("#gridSlider").val())*10;
                $("#sliderOutput").text($("#gridSlider").val());
            });
        }
        else
        {
            $("#originSelect").remove();
            $(".slidecontainer").css("display","none");
        }
    });

    $("#scaleUnity").change(function(){
        alert("setScale");
        scaleUnity = parseInt($("#scaleUnity") .val());
    });
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
        else if(shiftDown && !markEndPoint && SelectedNodeIndex != -1)
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
            if(shiftDown)
            {
                Nodes[SelectedNodeIndex].setStartPoint();
            }
            else
            {
                Nodes[SelectedNodeIndex].setEndPoint();
            }
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
    adj_mat=[];
    JSONNodes=[];
    ShowAdjecencyMat();
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
        MovePoint(SelectedNodeIndex);
    }
    ctx.clearRect(0,0,canvas.clientWidth,canvas.height);
    if(snap)
    {
        drawGrid();
        NearestPoint();
        DrawOrigin();
        getRelativePoints();
        SetUnityCoordinates();
    }
    for(let i=0;i<Edges.length;i++)
    {
        Edges[i].draw();
    }
    for (let i = 0; i < Nodes.length; i++) {
        Nodes[i].draw();
    }
    if((weightAssigner && SelectedNodeIndex != -1 || RadialSelector.choosingEdge))
    {
        if(adj_mat.length==0)
        {
            AdjecencyMat();
        }
        RadialSelector.Activate(Nodes[SelectedNodeIndex],10);
    }
    window.requestAnimationFrame(Update);
}

function stringify()
{
    var myString ="";
    for (var i = 0; i < adj_mat.length; i++) {
        for (var j = 0; j < adj_mat[i].length; j++) {
            myString+=adj_mat[i][j].toString();
            if(j<adj_mat[i].length-1)
            {
                myString+=",";
            }
        }
        if(i<adj_mat.length-1)
        {
            myString+=";";
        }
    }
    console.log(myString);
    return myString;
}

function Download()
{
    $("#downloadContainer").empty();
    CreateJSONObject();
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSONNodes));
    $('<a href="data:' + data + '" download="data.json">download JSON</a>').appendTo('#downloadContainer');
}