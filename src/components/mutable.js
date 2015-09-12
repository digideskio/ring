pw.component.register('mutable', function (view, config) {
  this.mutation = function (mutation) {
    // no socket, just submit the form
    if (!window.socket) {
      view.node.submit();
      return;
    }

    var datum = pw.util.dup(mutation);
    delete datum.__nested;
    delete datum.scope;
    delete datum.id;

    var message = {
      action: 'call-route'
    };

    if (view.node.tagName === 'FORM') {
      var method;
      var $methodOverride = view.node.querySelector('input[name="_method"]');
      if ($methodOverride) {
        method = $methodOverride.value;
      } else {
        method = view.node.getAttribute('method');
      }

      message.method = method;
      message.uri = view.node.getAttribute('action');
      message.input = pw.node.serialize(view.node);
    } else {
      //TODO deduce uri / method

      var input = {};
      input[mutation.scope] = datum;
      message.input = input;
    }

    var self = this;
    window.socket.send(message, function (res) {
      if (res.status === 302 && res.headers.Location !== window.location.pathname) {
        var dest = res.headers.Location;
        //TODO trigger a response:redirect instead and let navigator subscribe
        history.pushState({ uri: dest }, dest, dest);
        return;
      } else if (res.status === 400) {
        // bad request
      } else {
        self.state.rollback();
      }

      pw.component.broadcast('response:received', { response: res });

      // TODO: not sure we want to do this
      // self.revert();
    });
  }
});
