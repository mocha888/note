var database_table = {}
var database = {
    init: function () {
        this.database_table_view();
        var _this = this;
        $('#SearchValue').keydown(function (e) {
            if (e.keyCode == 13) {
                var val = $(this).val();
                _this.database_table_view(val);
            }
        });
    },
    database_table_view:function(search){
        $('#bt_database_table').empty();
        database_table = bt_tools.table({
            el: '#bt_database_table',
            url: '/data?action=getData',
            param: {
                table: 'databases',
                search:search|| ''
            }, //参数
            minWidth: '1000px',
            default: "Database list is empty", // 数据为空时的默认提示
            column:[
                { fid: 'id', type: 'checkbox', width: 30 },
                {
                    fid: 'name',
                    width: 120,
                    title: lan.database.add_name,
                    template: function (item) {
                        return '<span class="limit-text-length" style="width: 120px;" title="' + item.name + '">' + item.name + '</span>';
                    }
                },
                {
                    fid: 'username',
                    width: 120,
                    title: lan.database.user,
                    sort: function () {
                        database_table.$refresh_table_list(true);
                    },
                    template: function (item) {
                        return '<span class="limit-text-length" style="width: 120px;" title="' + item.username + '">' + item.username + '</span>';
                    }
                },
                {
                    fid:'password',
                    width: 200,
                    title:lan.database.add_pass,
                    type:'password',
                    copy:true,
                    eye_open:true
                },
                {
                    fid:'backup',
                    title: lan.database.backup,
                    width: 130,
                    template: function (item) {
                        var backup = lan.database.backup_empty,
                            _class = "bt_warning";
                        if (item.backup_count > 0) backup = lan.database.backup_ok, _class = "bt_success";
                        return '<span><a href="javascript:;" class="btlink ' + _class + '" onclick="database.database_detail('+ item.id+',\''+item.name+'\')">' + backup + (item.backup_count > 0 ? ('(' + item.backup_count + ')') : '') + '</a> | ' +
                            '<a href="javascript:database.input_database(\''+item.name+'\')" class="btlink">'+lan.database.input+'</a></span>';
                    }
                },
                // {
                //     fid: 'ps', title: lan.database.add_ps, templet: function (item) {
                //         var _ps = "<span class='c9 input-edit webNote' onclick=\"bt.pub.set_data_by_key('databases','ps',this)\" >"
                //         if (item.password) {
                //             _ps += item.ps
                //         } else {
                //             _ps += lan.database.cant_get_pass+'<span style="color:red">'+lan.database.edit_pass+'</span>'+lan.database.button_set_pass+'!';
                //         }
                //         _ps += "</span>";
                //         return _ps;
                //     }
                // },
                {
                    fid: 'ps',
                    title: lan.database.add_ps,
                    type: 'input',
                    blur: function (row, index, ev) {
                        bt.pub.set_data_ps({
                            id: row.id,
                            table: 'databases',
                            ps: ev.target.value
                        }, function (res) {
                            layer.msg(res.msg, (res.status ? {} : {
                                icon: 2
                            }));
                        });
                    },
                    keyup: function (row, index, ev) {
                        if (ev.keyCode === 13) {
                            $(this).blur();
                        }
                    }
                },
                {
                    type: 'group',
                    title: lan.database.operation,
                    width: 280,
                    align: 'right',
                    group: [{
                        title: lan.database.admin,
                        tips: lan.database.admin_title,
                        event: function(row) {
                            bt.database.open_phpmyadmin(row.name,row.username,row.password);
                        }
                    },{
                        title: lan.database.auth,
                        tips:lan.database.set_db_auth,
                        event: function(row) {
                            bt.database.set_data_access(row.username);
                        }
                    },{
                        title:lan.database.tools,
                        tips:lan.database.mysql_tools,
                        event: function(row){
                            database.rep_tools(row.name);
                        }
                    },{
                        title:lan.database.edit_pass,
                        tips:lan.database.edit_pass_title,
                        event: function(row){
                            database.set_data_pass(row.id,row.username,row.password);
                        }
                    },{
                        title:lan.database.del,
                        tips:lan.database.del_title,
                        event: function(row){
                            database.del_database(row.id,row.name);
                        }
                    }]
                }
            ],
            sortParam: function (data) {
                return {
                    'order': data.name + ' ' + data.sort
                };
            },
            tootls: [{ // 按钮组
                type: 'group',
                positon: ['left', 'top'],
                list: [{
                    title: lan.database.add_title,
                    active: true,
                    event: function () {
                        bt.database.add_database(function (res){
                            if(res.status) database_table.$refresh_table_list(true);
                        })
                    }
                },{
                    title: lan.database.edit_root,
                    event: function () {
                        bt.database.set_root('root')
                    }
                },{
                    title: 'phpMyAdmin',
                    event: function () {
                        bt.database.open_phpmyadmin('','root', bt.config.mysql_root)
                    }
                },{
                    title: 'Sync all',
                    style: {'margin-left':'30px'},
                    event: function () {
                        database.sync_to_database(0)
                    }
                },{
                    title: 'Get DB from server',
                    event: function () {
                        // database.sync_to_database(1)
                        bt.database.sync_database(function (rdata) {
                            if (rdata.status) database_table.$refresh_table_list(true);
                        });
                    }
                }]
            },{
                type: 'batch', //batch_btn
                positon: ['left', 'bottom'],
                placeholder: 'Select batch operation',
                buttonValue: 'Execute',
                disabledSelectValue: 'Select the DB to execute!!',
                selectList: [{
                    title:'Sync to Server',
                    url:'/database?action=SyncToDatabases&type=1',
                    paramName: 'ids', //列表参数名,可以为空
                    paramId: 'id', // 需要传入批量的id
                    th:'Database Name',
                    beforeRequest: function(list) {
                        var arry = [];
                        $.each(list, function (index, item) {
                            arry.push(item.id);
                        });
                        return JSON.stringify(arry)
                    },
                    success: function (res, list, that) {
                        layer.closeAll();
                        var html = '';
                        $.each(list, function (index, item) {
                            html += '<tr><td>' + item.name + '</td><td><div style="float:right;"><span style="color:' + (res.status ? '#20a53a' : 'red') + '">' + res.msg + '</span></div></td></tr>';
                        });
                        that.$batch_success_table({
                            title: 'Batch sync selected',
                            th: 'Database Name',
                            html: html
                        });
                    }
                },{
                    title: "Delete database",
                    url: '/database?action=DeleteDatabase',
                    load: true,
                    param: function (row) {
                        return {
                            id: row.id,
                            name: row.name
                        }
                    },
                    callback: function (that) { // 手动执行,data参数包含所有选中的站点
                        var ids = [];
                        for (var i = 0; i < that.check_list.length; i++) {
                            ids.push(that.check_list[i].id);
                        }
                        database.del_database(ids,function(param){
                            that.start_batch(param, function (list) {
                                layer.closeAll()
                                var html = '';
                                for (var i = 0; i < list.length; i++) {
                                    var item = list[i];
                                    html += '<tr><td>' + item.name + '</td><td><div style="float:right;"><span style="color:' + (item.request.status ? '#20a53a' : 'red') + '">' + item.request.msg + '</span></div></td></tr>';
                                }
                                database_table.$batch_success_table({
                                    title: 'Batch deletion',
                                    th: 'Database Name',
                                    html: html
                                });
                            });
                            database_table.$refresh_table_list(true);
                        })
                    }
                }]
            }, { //分页显示
                type: 'page',
                positon: ['right', 'bottom'], // 默认在右下角
                pageParam: 'p', //分页请求字段,默认为 : p
                page: 1, //当前分页 默认：1
                numberParam: 'limit', //分页数量请求字段默认为 : limit
                number: 20, //分页数量默认 : 20条
                numberList: [10, 20, 50, 100, 200], // 分页显示数量列表
                numberStatus: true, //　是否支持分页数量选择,默认禁用
                jump: true, //是否支持跳转分页,默认禁用
            }]
        });
    },
    rep_tools: function (db_name, res) {
        var loadT = layer.msg(lan.database.get_data, { icon: 16, time: 0 });
        bt.send('GetInfo', 'database/GetInfo', { db_name: db_name }, function (rdata) {
            layer.close(loadT)
            if (rdata.status === false) {
                layer.msg(rdata.msg, { icon: 2 });
                return;
            }
            var types = { InnoDB: "InnoDB", MyISAM: "MyISAM" };
            var tbody = '';
            for (var i = 0; i < rdata.tables.length; i++) {
                if (!types[rdata.tables[i].type]) continue;
                tbody += '<tr>\
                        <td><input value="dbtools_' + rdata.tables[i].table_name + '" class="check" onclick="database.selected_tools(null,\'' + db_name + '\');" type="checkbox"></td>\
                        <td><span style="width:150px;"> ' + rdata.tables[i].table_name + '</span></td>\
                        <td>' + rdata.tables[i].type + '</td>\
                        <td><span style="width:90px;"> ' + rdata.tables[i].collation + '</span></td>\
                        <td>' + rdata.tables[i].rows_count + '</td>\
                        <td>' + rdata.tables[i].data_size + '</td>\
                        <td style="text-align: right;">\
                            <a class="btlink" onclick="database.rep_database(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">'+lan.database.backup_re+'</a> |\
                            <a class="btlink" onclick="database.op_database(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\')">'+lan.database.optimization+'</a> |\
                            <a class="btlink" onclick="database.to_database_type(\''+ db_name + '\',\'' + rdata.tables[i].table_name + '\',\'' + types[rdata.tables[i].type] + '\')">'+ lan.database.change + types[rdata.tables[i].type] + '</a>\
                        </td>\
                    </tr> '
            }

            if (res) {
                $(".gztr").html(tbody);
                $("#db_tools").html('');
                $("input[type='checkbox']").attr("checked", false);
                $(".tools_size").html(lan.database.size+'：' + rdata.data_size);
                return;
            }

            layer.open({
                type: 1,
                title: lan.database.mysql_tools_box+"【" + db_name + "】",
                area: ['850px', '580px'],
                closeBtn: 2,
                shadeClose: false,
                content: '<div class="plr15 mt10">\
                                <div class="db_list">\
                                    <span><a style="width: 239px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;display: inline-block;vertical-align: bottom;margin-right: 11px;" title="'+ db_name + '">'+lan.database.db_name+'：'+ db_name + '</a>\
                                    <a class="tools_size">'+lan.database.size+'：'+ rdata.data_size + '</a></span>\
                                    <span id="db_tools" style="float: right;"></span>\
                                </div >\
                                <div class="divtable">\
                                <div  id="database_fix"  style="height:360px;overflow:auto;border:#ddd 1px solid">\
                                <table class="table table-hover "style="border:none">\
                                    <thead>\
                                        <tr>\
                                            <th><input class="check" onclick="database.selected_tools(this,\''+ db_name + '\');" type="checkbox"></th>\
                                            <th>'+lan.database.tb_name+'</th>\
                                            <th>'+lan.database.engine+'</th>\
                                            <th>'+lan.database.character+'</th>\
                                            <th  width="80">'+lan.database.row_num+'</th>\
                                            <th>'+lan.database.size+'</th>\
                                            <th style="text-align: right;">'+lan.database.operation+'</th>\
                                        </tr>\
                                    </thead>\
                                    <tbody class="gztr">' + tbody + '</tbody>\
                                </table>\
                                </div>\
                            </div>\
                            <ul class="help-info-text c7">\
                                <li>'+lan.database.tb_repair+'</li>\
                                <li>'+lan.database.tb_optimization+'</li>\
                                <li>'+lan.database.tb_change_engine+'</li>\
                            </ul></div>'
            });
            tableFixed('database_fix');
            //表格头固定
            function tableFixed(name) {
                var tableName = document.querySelector('#' + name);
                tableName.addEventListener('scroll', scrollHandle);
            }
            function scrollHandle(e) {
                var scrollTop = this.scrollTop;
                //this.querySelector('thead').style.transform = 'translateY(' + scrollTop + 'px)';
                $(this).find("thead").css({ "transform": "translateY(" + scrollTop + "px)", "position": "relative", "z-index": "1" });
            }
        });
    },
    selected_tools: function (my_obj, db_name) {
        var is_checked = false

        if (my_obj) is_checked = my_obj.checked;
        var db_tools = $("input[value^='dbtools_']");
        var n = 0;
        for (var i = 0; i < db_tools.length; i++) {
            if (my_obj) db_tools[i].checked = is_checked;
            if (db_tools[i].checked) n++;
        }
        if (n > 0) {
            var my_btns = '<button class="btn btn-default btn-sm" onclick="database.rep_database(\'' + db_name + '\',null)">'+lan.database.repair+'</button><button class="btn btn-default btn-sm" onclick="database.op_database(\'' + db_name + '\',null)">'+lan.database.optimization+'</button><button class="btn btn-default btn-sm" onclick="database.to_database_type(\'' + db_name + '\',null,\'InnoDB\')">'+lan.database.change+'InnoDB</button></button><button class="btn btn-default btn-sm" onclick="database.to_database_type(\'' + db_name + '\',null,\'MyISAM\')">'+lan.database.change+'MyISAM</button>'
            $("#db_tools").html(my_btns);
        } else {
            $("#db_tools").html('');
        }
    },
    rep_database: function (db_name, tables) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg(lan.database.send_repair_command, { icon: 16, time: 0 });
        bt.send('ReTable', 'database/ReTable', { db_name: db_name, tables: JSON.stringify(dbs) }, function (rdata) {
            layer.close(loadT)
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
            database.rep_tools(db_name, true);
        });
    },
    op_database: function (db_name, tables) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg(lan.database.send_opt_command, { icon: 16, time: 0 });
        bt.send('OpTable', 'database/OpTable', { db_name: db_name, tables: JSON.stringify(dbs) }, function (rdata) {
            layer.close(loadT)
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
            database.rep_tools(db_name, true);
        });
    },
    to_database_type: function (db_name, tables, type) {
        dbs = database.rep_checkeds(tables)
        var loadT = layer.msg(lan.database.send_change_command, { icon: 16, time: 0, shade: [0.3, "#000"] });
        bt.send('AlTable', 'database/AlTable', { db_name: db_name, tables: JSON.stringify(dbs), table_type: type }, function (rdata) {
            layer.close(loadT);
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
            database.rep_tools(db_name, true);
        });
    },
    rep_checkeds: function (tables) {
        var dbs = []
        if (tables) {
            dbs.push(tables)
        } else {
            var db_tools = $("input[value^='dbtools_']");
            for (var i = 0; i < db_tools.length; i++) {
                if (db_tools[i].checked) dbs.push(db_tools[i].value.replace('dbtools_', ''));
            }
        }

        if (dbs.length < 1) {
            layer.msg(lan.database.choose_at_least_one_tb, { icon: 2 });
            return false;
        }
        return dbs;
    },
    sync_to_database: function (type) {
        var data = [];
        $('input[type="checkbox"].check:checked').each(function () {
            if (!isNaN($(this).val())) data.push($(this).val());
        });
        bt.database.sync_to_database({ type: type, ids: JSON.stringify(data) }, function (rdata) {
            if (rdata.status) database_table.$refresh_table_list(true);
        });
    },
    sync_database: function () {
        bt.database.sync_database(function (rdata) {
            if (rdata.status) database_table.$refresh_table_list(true);
        })
    },
    add_database: function () {
        bt.database.add_database(function (rdata) {
            if (rdata.status) database_table.$refresh_table_list(true);
        })
    },
    batch_database: function (type, arr, result) {
        if (arr == undefined) {
            arr = [];
            result = { count: 0, error_list: [] };
            $('input[type="checkbox"].check:checked').each(function () {
                var _val = $(this).val();
                if (!isNaN(_val)) arr.push($(this).parents('tr').data('item'));
            })
            bt.show_confirm(lan.database.del_all_title, "<a style='color:red;'>" + lan.get('del_all_database', [arr.length]) + "</a>", function () {
                bt.closeAll();
                database.batch_database(type, arr, result);
            });
            return;
        }
        var item = arr[0];
        switch (type) {
            case 'del':
                if (arr.length < 1) {
                    database_table.$refresh_table_list(true);
                    bt.msg({ msg: lan.get('del_all_database_ok', [result.count]), icon: 1, time: 5000 });
                    return;
                }
                bt.database.del_database({ id: item.id, name: item.name }, function (rdata) {
                    if (rdata.status) {
                        result.count += 1;
                    } else {
                        result.error_list.push({ name: item.item, err_msg: rdata.msg });
                    }
                    arr.splice(0, 1)
                    database.batch_database(type, arr, result);
                })
                break;
        }
    },
    del_database: function (wid, dbname, callback) {
        var rendom = bt.get_random_code(),num1 = rendom['num1'],num2 = rendom['num2'],title = '';
        title = typeof dbname === "function" ?'Batch delete databases':'Delete database [ '+ dbname +' ]';
        layer.open({
            type:1,
            title:title,
            icon:0,
            skin:'delete_site_layer',
            area: "530px",
            closeBtn: 2,
            shadeClose: true,
            content:"<div class=\'bt-form webDelete pd30\' id=\'site_delete_form\'>" +
                "<i class=\'layui-layer-ico layui-layer-ico0\'></i>" +
                "<div class=\'f13 check_title\' style=\'margin-bottom: 20px;\'>The deletion may affect the business!</div>" +
                "<div style=\'color:red;margin:18px 0 18px 18px;font-size:14px;font-weight: bold;\'>Note: The data is priceless, please operate with caution! ! !"+(!recycle_bin_db_open?'<br><br>Risk: The DB recycle bin is not enabled, deleting will disappear forever!':'')+"</div>" +
                "<div class=\'vcode\'>" + lan.bt.cal_msg + "<span class=\'text\'>"+ num1 +" + "+ num2 +"</span>=<input type=\'number\' id=\'vcodeResult\' value=\'\'></div>" +
                "</div>",
            btn:[lan.public.ok,lan.public.cancel],
            yes:function(indexs){
                var vcodeResult = $('#vcodeResult'),data = {id: wid,name: dbname};
                if(vcodeResult.val() === ''){
                    layer.tips('Calculation result cannot be empty', vcodeResult, {tips: [1, 'red'],time:3000})
                    vcodeResult.focus()
                    return false;
                }else if(parseInt(vcodeResult.val()) !== (num1 + num2)){
                    layer.tips('Incorrect calculation result', vcodeResult, {tips: [1, 'red'],time:3000})
                    vcodeResult.focus()
                    return false;
                }
                if(typeof dbname === "function"){
                    delete data.id;
                    delete data.name;
                }
                layer.close(indexs)
                var arrs = wid instanceof Array ? wid : [wid]
                var ids = JSON.stringify(arrs), countDown = 9;
                if (arrs.length == 1) countDown = 4
                title = typeof dbname === "function" ?'Confirm the information again, delete the database in batches':'Confirm the information again, Delete Database [ ' + dbname + ' ]';
                var loadT = bt.load('Checking database data information, please wait...')
                bt.send('check_del_data', 'database/check_del_data', {ids: ids}, function (res) {
                    loadT.close()
                    layer.open({
                        type:1,
                        title:title,
                        closeBtn: 2,
                        skin: 'verify_site_layer_info active',
                        area: '740px',
                        content: '<div class="check_delete_site_main pd30">' +
                            '<i class="layui-layer-ico layui-layer-ico0"></i>' +
                            '<div class="check_layer_title">aaPanel kindly reminds you, please calm down for a few seconds, and then confirm whether you want to delete the data.</div>' +
                            '<div class="check_layer_content">' +
                            '<div class="check_layer_item">' +
                            '<div class="check_layer_site"></div>' +
                            '<div class="check_layer_database"></div>' +
                            '</div>' +
                            '</div>' +
                            '<div class="check_layer_error ' + (recycle_bin_db_open ? 'hide' : '') + '"><span class="glyphicon glyphicon-info-sign"></span>Risk: The database recycle bin is not enabled. After the database is deleted, the database will disappear forever!</div>' +
                            '<div class="check_layer_message">Please read the above information to be deleted carefully to prevent the database from being deleted by mistake. Confirm the deletion and there is still <span style="color:red;font-weight: bold;">' + countDown + '</span> seconds to operate.</div>' +
                            '</div>',
                        btn: ['Delete (Can be operated after ' + countDown + ' seconds)', 'Cancel'],
                        success: function (layers) {
                            var html = '', rdata = res.data;
                            var filterData = rdata.filter(function(el){
                                return  ids.indexOf(el.id) != -1
                            })
                            for (var i = 0; i < filterData.length; i++) {
                                var item = filterData[i], newTime = parseInt(new Date().getTime() / 1000),
                                    t_icon = '<span class="glyphicon glyphicon-info-sign" style="color: red;width:15px;height: 15px;;vertical-align: middle;"></span>';

                                database_html = (function(item){
                                    var is_time_rule = (newTime - item.st_time) > (86400 * 30)  && (item.total > 1024 * 10),
                                        is_database_rule = res.db_size <= item.total,
                                        database_time = bt.format_data(item.st_time, 'yyyy-MM-dd'),
                                        database_size = bt.format_size(item.total);

                                    var f_size = '<i ' + (is_database_rule ? 'class="warning"' : '') + ' style = "vertical-align: middle;" > ' + database_size + '</i> ' + (is_database_rule ? t_icon : '');
                                    var t_size = 'Note: This database is large and may be important data. Please operate with caution.\nDatabase: ' + database_size;

                                    return '<div class="check_layer_database">' +
                                        '<span title="Database: ' + item.name + '">Database: ' + item.name + '</span>' +
                                        '<span '+ (item.total > 0 ? 'title="' + t_size+'"' : '')+'>Size: ' + f_size +'</span>' +
                                        '<span title="' + (is_time_rule && item.total != 0 ? 'Important: This database was created earlier and may be important data. Please operate with caution.' : '') + 'Time：' + database_time+'">Ctime：<i ' + (is_time_rule && item.total != 0 ? 'class="warning"' : '') + '>' + database_time + '</i></span>' +
                                        '</div>'
                                }(item))
                                if(database_html !== '') html += '<div class="check_layer_item">' + database_html +'</div>';
                            }
                            if(html === '') html = '<div style="text-align: center;width: 100%;height: 100%;line-height: 300px;font-size: 15px;">No data</div>'
                            $('.check_layer_content').html(html)
                            var interVal = setInterval(function () {
                                countDown--;
                                $(layers).find('.layui-layer-btn0').text('Delete (Can be operated after ' + countDown + ' seconds)')
                                $(layers).find('.check_layer_message span').text(countDown)
                            }, 1000);
                            setTimeout(function () {
                                $(layers).find('.layui-layer-btn0').text('Delete');
                                $(layers).find('.check_layer_message').html('<span style="color:red">Note: Please read carefully the above information to be deleted to prevent the database from being deleted by mistake</span>')
                                $(layers).removeClass('active');
                                clearInterval(interVal)
                            }, countDown * 1000)
                        },
                        yes:function(indes,layers){
                            if($(layers).hasClass('active')){
                                layer.tips('Please confirm the message, there are '+ countDown +' seconds left', $(layers).find('.layui-layer-btn0') , {tips: [1, 'red'],time:3000})
                                return;
                            }
                            if(typeof dbname === "function"){
                                dbname(data)
                            }else{
                                bt.database.del_database(data, function (rdata) {
                                    layer.closeAll()
                                    if(rdata.status) database_table.$refresh_table_list(true);
                                    if (callback) callback(rdata);
                                    bt.msg(rdata);
                                })
                            }
                        }
                    })
                })
            }
        })
    },
    set_data_pass: function (id, username, password) {
        var bs = bt.database.set_data_pass(function (rdata) {
            if(rdata.status) database_table.$refresh_table_list(true);
            bt.msg(rdata);
        })
        $('.name' + bs).val(username);
        $('.id' + bs).val(id);
        $('.password' + bs).val(password);
    },
    database_detail: function (id, dataname, page) {
        if (page == undefined) page = '1';
        var loadT = bt.load(lan.public.the_get);
        bt.pub.get_data('table=backup&search=' + id + '&limit=5&type=1&tojs=database.database_detail&p=' + page, function (frdata) {
            loadT.close();
            var ftpdown = '';
            var body = '';
            var port;
            frdata.page = frdata.page.replace(/'/g, '"').replace(/database.database_detail\(/g, "database.database_detail(" + id + ",'" + dataname + "',");
            if ($('#DataBackupList').length <= 0) {
                bt.open({
                    type: 1,
                    skin: 'demo-class',
                    area: '700px',
                    title: lan.database.backup_title,
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: "<div class='divtable pd15 style='padding-bottom: 0'><button id='btn_data_backup' class='btn btn-success btn-sm' type='button' style='margin-bottom:10px'>" + lan.database.backup + "</button><table width='100%' id='DataBackupList' class='table table-hover'></table><div class='page databackup_page'></div></div>"
                });
            }
            setTimeout(function () {
                $('.databackup_page').html(frdata.page);
                var _tab = bt.render({
                    table: '#DataBackupList',
                    columns: [
                        { field: 'name', title: lan.database.backup_name, templet: function (item) {
                                var _opt = '<span class="btlink" style="display: inline-block;max-width: 265px;">'+item.name+'</span>'
                                return _opt;
                            }
                        },
                        {
                            field: 'size', title: lan.database.backup_size, templet: function (item) {
                                return bt.format_size(item.size);
                            }
                        },
                        { field: 'addtime', title: lan.database.backup_time },
                        {
                            field: 'opt', title: lan.database.operation, align: 'right', templet: function (item) {
                                var _opt = '<a class="btlink" herf="javascrpit:;" onclick="bt.database.input_sql(\'' + item.filename + '\',\'' + dataname + '\')">'+lan.database.backup_re+'</a> | ';
                                _opt += '<a class="btlink" href="/download?filename=' + item.filename + '&amp;name=' + item.name + '" target="_blank">'+lan.database.download+'</a> | ';
                                _opt += '<a class="btlink" herf="javascrpit:;" onclick="bt.database.del_backup(\'' + item.id + '\',\'' + id + '\',\'' + dataname + '\')">'+lan.database.del+'</a>'
                                return _opt;
                            }
                        },
                    ],
                    data: frdata.data
                });
                $('#btn_data_backup').unbind('click').click(function () {
                    bt.database.backup_data(id, dataname, function (rdata) {
                        if (rdata.status) database.database_detail(id, dataname);
                        if(rdata.status) database_table.$refresh_table_list(true);
                        if (!rdata.status) layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
                    })
                })
            }, 100)
        });
    },
    upload_files: function (name) {
        var path = bt.get_cookie('backup_path') + "/database/";
        bt_upload_file.open(path, '.sql,.gz,.tar.gz,.zip', lan.database.input_up_type, function () {
            database.input_database(name);
        });
    },
    input_database: function (name) {
        var path = bt.get_cookie('backup_path') + "/database";
        bt.send('get_files', 'files/GetDir', 'reverse=True&sort=mtime&tojs=GetFiles&p=1&showRow=100&path=' + path, function (rdata) {
            var data = [];
            for (var i = 0; i < rdata.FILES.length; i++) {
                if (rdata.FILES[i] == null) continue;
                var fmp = rdata.FILES[i].split(";");
                var ext = bt.get_file_ext(fmp[0]);
                if (ext != 'sql' && ext != 'zip' && ext != 'gz' && ext != 'tgz') continue;
                data.push({ name: fmp[0], size: fmp[1], etime: fmp[2], })
            }
            if ($('#DataInputList').length <= 0) {
                bt.open({
                    type: 1,
                    skin: 'demo-class',
                    area: '600px',
                    title: lan.database.input_title_file+'['+name+']',
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: '<div class="pd15"><button class="btn btn-default btn-sm" onclick="database.upload_files(\'' + name + '\')">' + lan.database.input_local_up + '</button><div class="divtable mtb15" style="max-height:300px; overflow:auto">'
                        + '<table id="DataInputList" class="table table-hover databaseImportTable" style="table-layout: fixed;"></table>'
                        + '</div>'
                        + bt.render_help([lan.database.input_ps1, lan.database.input_ps2, (bt.os != 'Linux' ? lan.database.input_ps3.replace(/\/www.*\/database/, path) : lan.database.input_ps3)])
                        + '</div>'
                });
            }
            setTimeout(function () {
                var _tab = bt.render({
                    table: '#DataInputList',
                    columns: [
                        { field: 'name', title: lan.files.file_name, width:190 },
                        {
                            field: 'etime', title: lan.files.file_etime, width:130, templet: function (item) {
                                return bt.format_data(item.etime);
                            }
                        },
                        {
                            field: 'size', title: lan.files.file_size, width:70, templet: function (item) {
                                return bt.format_size(item.size)
                            }
                        },
                        {
                            field: 'opt', title: 'Operating', align: 'right', width:90, templet: function (item) {
                                return '<a class="btlink" herf="javascrpit:;" onclick="bt.database.input_sql(\'' + bt.rtrim(rdata.PATH, '/') + "/" + item.name + '\',\'' + name + '\')">'+lan.database.input+'</a>  | <a class="btlink" onclick="database.remove_input_file(\'' + bt.rtrim(rdata.PATH, '/') + "/" + item.name + '\',\'' + name + '\')">Del</a>';
                            }
                        },
                    ],
                    data: data
                });
            }, 100)
        })
    },
    remove_input_file: function (fileName,name) {
        layer.confirm(lan.get('recycle_bin_confirm', [fileName]), { title: lan.files.del_file, closeBtn: 2, icon: 3 }, function (index) {
            layer.msg(lan.public.the, { icon: 16, time: 0, shade: [0.3, '#000'] });
            $.post('/files?action=DeleteFile', 'path=' + encodeURIComponent(fileName), function (rdata) {
                layer.close(index);
                layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
                database.input_database(name);
            });
        });
    },
    //浏览器窗口大小变化时调整内容宽度
    forSize:function(){
        var ticket_with = $('#DataBody').parent().width(),
        td_width = ticket_with*0.8-30-$('#DataBody th:eq(2)').width()-$('#DataBody th:eq(3)').width()-$('#DataBody th:eq(4)').width()-$('#DataBody th:eq(6)').width();
        $('#DataBody .webNote').css('max-width',td_width);
    }
}
database.init();