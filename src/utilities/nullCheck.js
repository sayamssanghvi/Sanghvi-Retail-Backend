let IsNullOrUndefined = (value)=>{
    if (value == undefined || value == null)
        return true;
    else
        return false;
}

module.exports = IsNullOrUndefined;