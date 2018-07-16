import Util from '../../src/modules/Util.js';

describe('Util module', function() {
    describe('.isNumber(variable)', function() {
        it('should return true if argument is a number', function() {
            expect(Util.isNumber(3.2)).to.be.true;
            expect(Util.isNumber(-3.2)).to.be.true;
            expect(Util.isNumber(0)).to.be.true;
        });

        it('should return false if argument is not a number', function() {
            expect(Util.isNumber('3.2')).to.be.false;
            expect(Util.isNumber([1])).to.be.false;
            expect(Util.isNumber(NaN)).to.be.false;
        });
    });

    describe('.isCallable(variable)', function() {
        it('should return true if argument is a function', function() {
            expect(Util.isCallable(name => name)).to.be.true;
        });

        it('should return false if argument is not a function', function() {
            expect(Util.isCallable(new RegExp('a'))).to.be.false;
        });
    });

    describe('.isArray(variable)', function() {
        it('should return true if argument is an array', function() {
            expect(Util.isArray([])).to.be.true;
        });

        it('should return false if argument is not an array', function() {
            expect(Util.isArray({})).to.be.false;
            expect(Util.isArray('')).to.be.false;
        });
    });

    describe('.isObject(variable)', function() {
        it('should return true if argument is an object', function() {
            expect(Util.isObject({})).to.be.true;
            expect(Util.isObject([])).to.be.true;
        });

        it('should return false if argument is not an object', function() {
            expect(Util.isObject('')).to.be.false;
            expect(Util.isObject(null)).to.be.false;
            expect(Util.isObject(undefined)).to.be.false;
        });
    });

    describe('.isPlainObject(variable)', function() {
        it('should return true if argument is a plain object', function() {
            expect(Util.isPlainObject({})).to.be.true;
            expect(Util.isPlainObject(Object.create(null))).to.be.true;
        });

        it('should return false if argument is not a plain object', function() {
            expect(Util.isPlainObject([])).to.be.false;
            expect(Util.isPlainObject(this)).to.be.false;
            expect(Util.isPlainObject('')).to.be.false;
        });
    });

    describe('.camelCase(value, delimiter?)', function() {

        it('should apply camel like casing on the argument and return the result. default delimiter used is dash or underscore characters', function() {
            expect(Util.camelCase('my-dog')).to.equals('myDog');
        });

        it('should accept an optional delimiter string or regex pattern as a second argument', function() {
            expect(Util.camelCase('my dog is cool', ' ')).to.equals('myDogIsCool');
        });
    });

    describe('.mergeObjects(...objects)', function() {

        it(`should deeply merge all the comma separated list of object arguments and return
        the new object`, function() {
            let obj1 = {name: 'house1', details: {height: 30, width: 40}};
            let obj2 = {nickName: 'Finest House', details: {rooms: 40}};
            let obj3 = {oldName: 'Fine House', details: {height: 35}};

            expect(Util.mergeObjects(obj1, obj2, obj3)).to.deep.equals({
                name: 'house1', nickName: 'Finest House', oldName: 'Fine House',
                details: {height: 35, width: 40, rooms: 40}
            });
        });

        it(`should ignore non plain object argument`, function() {
            let obj1 = {name: 'house1', details: {height: 30, width: 40}};
            let obj2 = {nickName: 'Finest House', details: {rooms: 40}};
            let obj3 = {oldName: 'Fine House', details: {height: 35}};

            expect(Util.mergeObjects(obj1, obj2, obj3, null)).to.deep.equals({
                name: 'house1', nickName: 'Finest House', oldName: 'Fine House',
                details: {height: 35, width: 40, rooms: 40}
            });
        });

        it(`should not override non object field with an object field`, function() {
            let obj1 = {name: 'house1', details: {height: 30, width: 40}};
            let obj2 = {nickName: 'Finest House', details: {rooms: 40}};
            let obj3 = {oldName: 'Fine House', details: {height: 35}};
            let obj4 = {name: {value: 'house2'}};

            expect(Util.mergeObjects(obj1, obj2, obj3, obj4)).to.deep.equals({
                name: 'house1', nickName: 'Finest House', oldName: 'Fine House',
                details: {height: 35, width: 40, rooms: 40}
            });
        });
    });
});