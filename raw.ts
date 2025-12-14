var r=[126,142,106,131,148,196,180,154,168,252,278,284,310,241,259,334,294,309,414,430];
var o=String.fromCharCode
function i(){for(var e=r,t=[],n=0;n<e.length;n++)t.push(o(e[n]-16*n));return t.join("")}
const paramSign = function(e,t){var o=new Array;for(var r in t)o.push(r);o=o.sort();var a="",s="";for(var c in o)a+=s+(c=o[c])+"="+t[c],s="&";var u=new Date,l=u.getMonth()+1;l=l>9?l:"0"+l;var f=u.getDate()>9?u.getDate():"0"+u.getDate(),d=u.getFullYear()+""+l+f,p=[i(),"#",e,"-",a,"~",d].join("");return n.MD5(p)+""}

const getRTP=(url: string, data: any)=>{
  var o = Object.assign({}, data);
  switch(url) {
    // case"/api/shop/bargainings_ws":
    //   "unmi"in o&&delete o.unmi;
    //   o.id=e.getStorageSync("userinfo").id;
    //   break;
    case"/api/shop/activity":
      o={p:o.page,c:void 0===o.city?"bj":o.city};
      break;
    case"/api/user/thirds":
      o={code:o.code};
      break;
  }
  return o;
}