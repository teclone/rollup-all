import Util from '../../src/modules/Util.js';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

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
            let obj2 = {nickName: 'Finest House', details: {rooms: 40}, name: {value: 'house2'}};
            let obj3 = {oldName: 'Fine House', details: 'no details'};

            expect(Util.mergeObjects(obj1, obj2, obj3)).to.deep.equals({
                name: {value: 'house2'}, nickName: 'Finest House', oldName: 'Fine House',
                details: 'no details'
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
    });

    describe('.mkDirSync(dir)', function() {
        it(`should create the directory recursively if it does not exist`, function() {
            let dir = path.join(__dirname, '../../storage/media/images');
            Util.mkDirSync(dir);

            let result = fs.existsSync(dir);
            rimraf.sync(path.join(__dirname, '../../storage'));
            expect(result).to.be.true;
        });

        it(`should throw error if argument is not a string`, function() {
            expect(function() {
                Util.mkDirSync(null);
            }).to.throw(TypeError);
        });

        it(`should do nothing if the directory exists, or if the directory given is an empty
        string or the backward slash. it returns false`, function() {
            expect(Util.mkDirSync(path.resolve(__dirname))).to.be.false;
            expect(Util.mkDirSync('/')).to.be.false;
            expect(Util.mkDirSync('')).to.be.false;
        });
    });

    describe('.isProdEnv()', function() {
        it(`should return true if NODE_ENV starts with prod, case insensitive`, function() {
            process.env.NODE_ENV = 'production';
            expect(Util.isProdEnv()).to.be.true;
        });

        it(`should return false if NODE_ENV does not start with prod`, function() {
            process.env.NODE_ENV = 'Droduction';
            expect(Util.isProdEnv()).to.be.false;
        });
    });

    describe('.isDevEnv()', function() {
        it(`should return true if NODE_ENV does not start with prod, case insensitive`, function() {
            process.env.NODE_ENV = 'Droduction';
            expect(Util.isDevEnv()).to.be.true;
        });

        it(`should return false if NODE_ENV does start with prod, case insensitive`, function() {
            process.env.NODE_ENV = 'Production';
            expect(Util.isDevEnv()).to.be.false;
        });
    });
});